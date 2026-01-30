#!/bin/bash
# Ralph Test Discovery Loop
# Autonomous test case discovery agent - analyzes code and creates test definitions
#
# Usage:
#   ./.ralph-test/ralph.sh [OPTIONS]
#
# Options:
#   -w, --workspace PATH     Workspace directory (default: parent of script dir)
#   -m, --model MODEL        Model to use (default: sonnet-4.5-thinking)
#   -i, --iterations N       Max iterations (default: 30)
#   -t, --timeout SECONDS    Kill agent if stuck (default: 900 = 15 min)
#   -v, --verbose            Show full tool outputs
#   --debug                  Show raw JSON events
#   -T, --timestamps         Show timestamps on events
#   -h, --help               Show this help

set -euo pipefail

# Script directory (for finding prompt.md and other files)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# =============================================================================
# CONFIGURATION
# =============================================================================

MODEL="${RALPH_MODEL:-sonnet-4.5-thinking}"
MAX_ITERATIONS="${RALPH_MAX_ITERATIONS:-30}"
WORKSPACE="$(dirname "$SCRIPT_DIR")"  # Parent of .ralph-test
VERBOSE=false
DEBUG=false
SHOW_TIMESTAMPS=false

# Thresholds (test discovery is read-heavy, slightly higher thresholds)
WARN_THRESHOLD=160000
ROTATE_THRESHOLD=180000

# Timeout for stuck agent (in seconds) - 15 minutes (discovery is faster than dev)
AGENT_TIMEOUT="${RALPH_AGENT_TIMEOUT:-900}"

# Task paths (relative to workspace)
RALPH_DIR=".ralph-test"
TASKS_JSON="$RALPH_DIR/tasks.json"
PRD_FILE="$RALPH_DIR/PRD.md"
TESTS_JSON="$RALPH_DIR/tests.json"
KNOWLEDGE_FILE="$RALPH_DIR/knowledge.md"
PROGRESS_FILE="$RALPH_DIR/progress.md"

# =============================================================================
# ENVIRONMENT VARIABLES FOR LIVE TESTING
# These are available to the agent for browser/API testing
# =============================================================================
export BASE_URL="${BASE_URL:-http://localhost:3000}"
export SCREENSHOT_DIR="${SCREENSHOT_DIR:-.ralph-test/screenshots}"
export LOG_DIR="${LOG_DIR:-.ralph-test/logs}"

# =============================================================================
# ARGUMENT PARSING
# =============================================================================

show_help() {
  cat << 'EOF'
Ralph Test Discovery Loop - Autonomous Test Case Discovery

Usage: ./.ralph-test/ralph.sh [OPTIONS]

Options:
  -w, --workspace PATH     Workspace directory (default: repo root)
  -m, --model MODEL        Model to use (default: sonnet-4.5-thinking)
  -i, --iterations N       Max iterations (default: 30)
  -t, --timeout SECONDS    Kill agent if stuck for N seconds (default: 900)
  -v, --verbose            Show full tool outputs (file contents, etc.)
  --debug                  Show raw JSON events (implies --verbose)
  -T, --timestamps         Show timestamps on major events
  -h, --help               Show this help

Examples:
  ./.ralph-test/ralph.sh                       # Run test discovery
  ./.ralph-test/ralph.sh -v                    # Verbose mode
  ./.ralph-test/ralph.sh -m opus-4.5-thinking  # Use different model
  ./.ralph-test/ralph.sh -i 50                 # Allow 50 iterations

Requirements:
  - .ralph-test/tasks.json with discovery tasks
  - .ralph-test/tests.json for storing test cases
  - cursor-agent CLI installed
  - jq installed
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -w|--workspace)
        WORKSPACE="$2"
        shift 2
        ;;
      -m|--model)
        MODEL="$2"
        shift 2
        ;;
      -i|--iterations)
        MAX_ITERATIONS="$2"
        shift 2
        ;;
      -t|--timeout)
        AGENT_TIMEOUT="$2"
        shift 2
        ;;
      -v|--verbose)
        VERBOSE=true
        shift
        ;;
      --debug)
        DEBUG=true
        VERBOSE=true
        shift
        ;;
      -T|--timestamps)
        SHOW_TIMESTAMPS=true
        shift
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        echo "Unknown option: $1" >&2
        show_help >&2
        exit 1
        ;;
    esac
  done
}

# =============================================================================
# PREREQUISITES
# =============================================================================

check_prerequisites() {
  local errors=0

  # Check jq
  if ! command -v jq &> /dev/null; then
    echo "❌ jq not installed (brew install jq)" >&2
    errors=1
  fi

  # Check cursor-agent
  if ! command -v cursor-agent &> /dev/null; then
    echo "❌ cursor-agent not installed" >&2
    errors=1
  fi

  # Check tasks.json
  if [[ ! -f "$WORKSPACE/$TASKS_JSON" ]]; then
    echo "❌ No tasks file: $WORKSPACE/$TASKS_JSON" >&2
    errors=1
  elif ! jq empty "$WORKSPACE/$TASKS_JSON" 2>/dev/null; then
    echo "❌ Invalid JSON: $WORKSPACE/$TASKS_JSON" >&2
    errors=1
  fi

  # Check tests.json
  if [[ ! -f "$WORKSPACE/$TESTS_JSON" ]]; then
    echo "❌ No tests file: $WORKSPACE/$TESTS_JSON" >&2
    errors=1
  elif ! jq empty "$WORKSPACE/$TESTS_JSON" 2>/dev/null; then
    echo "❌ Invalid JSON: $WORKSPACE/$TESTS_JSON" >&2
    errors=1
  fi

  return $errors
}

# =============================================================================
# INITIALIZATION
# =============================================================================

init_ralph() {
  local ralph_dir="$WORKSPACE/$RALPH_DIR"
  mkdir -p "$ralph_dir"

  # Create directories for live testing outputs
  mkdir -p "$WORKSPACE/$SCREENSHOT_DIR"
  mkdir -p "$WORKSPACE/$LOG_DIR"

  # Initialize progress.md if it doesn't exist or is empty
  if [[ ! -f "$ralph_dir/progress.md" ]] || [[ ! -s "$ralph_dir/progress.md" ]]; then
    cat > "$ralph_dir/progress.md" << 'EOF'
# Test Discovery Progress Log

> Updated by the agent after each module analysis.
> **This loop is for test case CREATION and LIVE VALIDATION.**

## Session History

EOF
  fi

  # Create activity log if it doesn't exist
  [[ -f "$ralph_dir/activity.log" ]] || echo "# Activity Log" > "$ralph_dir/activity.log"
  
  # Create errors log if it doesn't exist
  [[ -f "$ralph_dir/errors.log" ]] || echo "# Error Log" > "$ralph_dir/errors.log"
  
  # Create iteration tracker if it doesn't exist
  [[ -f "$ralph_dir/.iteration" ]] || echo "0" > "$ralph_dir/.iteration"

  echo "✓ Initialized $ralph_dir"
}

# =============================================================================
# TASK MANAGEMENT
# =============================================================================

count_remaining() {
  jq '[.[] | select(.passes == false)] | length' "$WORKSPACE/$TASKS_JSON" 2>/dev/null || echo "0"
}

count_completed() {
  jq '[.[] | select(.passes == true)] | length' "$WORKSPACE/$TASKS_JSON" 2>/dev/null || echo "0"
}

count_total() {
  jq 'length' "$WORKSPACE/$TASKS_JSON" 2>/dev/null || echo "0"
}

get_next_task() {
  jq -r '
    [.[] | select(.passes == true) | .id] as $completed |
    [.[] | select(
      .passes == false and
      (.depends_on | all(. as $dep | $completed | contains([$dep])))
    )] | first |
    if . then "\(.id)|\(.description)" else "" end
  ' "$WORKSPACE/$TASKS_JSON" 2>/dev/null
}

is_complete() {
  [[ $(count_remaining) -eq 0 ]]
}

count_test_cases() {
  jq '.test_cases | length' "$WORKSPACE/$TESTS_JSON" 2>/dev/null || echo "0"
}

# =============================================================================
# LOGGING
# =============================================================================

log_activity() {
  local timestamp=$(date '+%H:%M:%S')
  echo "[$timestamp] $1" >> "$WORKSPACE/$RALPH_DIR/activity.log"
}

log_progress() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "\n### $timestamp\n$1" >> "$WORKSPACE/$RALPH_DIR/progress.md"
}

# =============================================================================
# PROMPT BUILDING
# =============================================================================

build_prompt() {
  local iteration="$1"
  
  # Get next task info
  local next_task_info=$(get_next_task)
  local next_task_id=""
  local next_task_desc=""
  if [[ -n "$next_task_info" ]]; then
    next_task_id=$(echo "$next_task_info" | cut -d'|' -f1)
    next_task_desc=$(echo "$next_task_info" | cut -d'|' -f2-)
  fi
  
  # Build current task section
  local current_task_section
  if [[ -n "$next_task_id" ]]; then
    local task_details=$(jq -r --arg id "$next_task_id" '
      .[] | select(.id == $id) | 
      {
        module: .module,
        priority: .priority,
        files: .files_to_analyze,
        steps: .steps,
        validation_note: .validation._note,
        validation_expected: .validation.expected
      }
    ' "$WORKSPACE/$TASKS_JSON" 2>/dev/null)
    
    local module=$(echo "$task_details" | jq -r '.module // "unknown"')
    local priority=$(echo "$task_details" | jq -r '.priority // "medium"')
    local files=$(echo "$task_details" | jq -r '.files | join("\n- ")' 2>/dev/null)
    local steps=$(echo "$task_details" | jq -r '.steps | join("\n- ")' 2>/dev/null)
    local expected=$(echo "$task_details" | jq -r '.validation_expected // "No criteria defined"')
    
    current_task_section="**Next task:** \`$next_task_id\` - $next_task_desc

**Module:** $module  |  **Priority:** $priority

**Files to analyze:**
- $files

**Steps to complete:**
- $steps

**Expected outcome:**
$expected

Get full task details with: \`jq '.[] | select(.id == \"$next_task_id\")' .ralph-test/tasks.json\`"
  else
    current_task_section="**No pending tasks with satisfied dependencies.**

Check if all tasks are complete or if there are dependency issues."
  fi
  
  # Read knowledge base
  local knowledge_content=""
  if [[ -f "$WORKSPACE/$KNOWLEDGE_FILE" ]]; then
    knowledge_content=$(cat "$WORKSPACE/$KNOWLEDGE_FILE")
  fi
  
  # Read prompt template
  local prompt_file="$SCRIPT_DIR/prompt.md"
  if [[ ! -f "$prompt_file" ]]; then
    echo "ERROR: prompt.md not found at $prompt_file" >&2
    exit 1
  fi
  
  # Read and substitute placeholders
  local prompt
  prompt=$(cat "$prompt_file")
  prompt="${prompt//\{\{ITERATION\}\}/$iteration}"
  prompt="${prompt//\{\{TASK_ID\}\}/$next_task_id}"
  prompt="${prompt//\{\{CURRENT_TASK\}\}/$current_task_section}"
  prompt="${prompt//\{\{KNOWLEDGE\}\}/$knowledge_content}"
  
  echo "$prompt"
}

# =============================================================================
# STREAM PARSER (with beautiful live output)
# =============================================================================

# Extended color palette
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_DIM="\033[2m"
C_ITALIC="\033[3m"

# Foreground colors
C_RED="\033[31m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_BLUE="\033[34m"
C_MAGENTA="\033[35m"
C_CYAN="\033[36m"
C_WHITE="\033[37m"

# Bright colors
C_BRIGHT_BLACK="\033[90m"
C_BRIGHT_RED="\033[91m"
C_BRIGHT_GREEN="\033[92m"
C_BRIGHT_YELLOW="\033[93m"
C_BRIGHT_BLUE="\033[94m"
C_BRIGHT_MAGENTA="\033[95m"
C_BRIGHT_CYAN="\033[96m"
C_BRIGHT_WHITE="\033[97m"

# Background colors
C_BG_BLACK="\033[40m"
C_BG_RED="\033[41m"
C_BG_GREEN="\033[42m"
C_BG_YELLOW="\033[43m"

# Unicode box drawing
BOX_TL="╭"
BOX_TR="╮"
BOX_BL="╰"
BOX_BR="╯"
BOX_H="─"
BOX_V="│"
BOX_VR="├"

# Icons
ICON_READ="📄"
ICON_WRITE="✏️ "
ICON_EDIT="🔧"
ICON_SHELL="⚡"
ICON_SEARCH="🔍"
ICON_FOLDER="📁"
ICON_SUCCESS="✓"
ICON_ERROR="✗"
ICON_THINK="💭"
ICON_CHAT="💬"
ICON_WARN="⚠️ "
ICON_TEST="🧪"

# Timestamp helper
ts() {
  if [[ "$SHOW_TIMESTAMPS" == "true" ]]; then
    printf "${C_BRIGHT_BLACK}%s ${C_RESET}" "$(date '+%H:%M:%S')"
  fi
}

# Format file path
format_path() {
  local path="$1"
  local dir=$(dirname "$path")
  local file=$(basename "$path")
  
  if [[ "$dir" == "." ]]; then
    printf "${C_BRIGHT_WHITE}${C_BOLD}${file}${C_RESET}"
  else
    printf "${C_DIM}${dir}/${C_RESET}${C_BRIGHT_WHITE}${C_BOLD}${file}${C_RESET}"
  fi
}

# Format file size
format_size() {
  local bytes="$1"
  if [[ $bytes -lt 1024 ]]; then
    echo "${bytes}B"
  elif [[ $bytes -lt 1048576 ]]; then
    echo "$((bytes / 1024))KB"
  else
    echo "$((bytes / 1048576))MB"
  fi
}

# Parse cursor-agent stream-json output
parse_stream() {
  local bytes_read=0
  local bytes_written=0
  local assistant_chars=0
  local shell_chars=0
  local warn_sent=0
  local current_text=""
  local in_thinking=0
  local tool_start_time=""

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue

    # Debug mode: show raw JSON
    if [[ "$DEBUG" == "true" ]]; then
      printf "${C_BRIGHT_BLACK}[RAW] %s${C_RESET}\n" "$line" >&2
    fi

    local type=$(echo "$line" | jq -r '.type // empty' 2>/dev/null) || continue
    local subtype=$(echo "$line" | jq -r '.subtype // empty' 2>/dev/null) || subtype=""

    case "$type" in
      "system")
        if [[ "$subtype" == "init" ]]; then
          local model=$(echo "$line" | jq -r '.model // "unknown"' 2>/dev/null)
          printf "\n$(ts)${C_DIM}${BOX_VR}${BOX_H}${BOX_H} ${C_CYAN}Session${C_RESET}${C_DIM} │ Model: ${C_BRIGHT_CYAN}%s${C_RESET}\n" "$model" >&2
          log_activity "SESSION START: model=$model"
        fi
        ;;

      "thinking")
        if [[ "$subtype" == "delta" ]]; then
          local thought=$(echo "$line" | jq -r '.thinking.content // empty' 2>/dev/null)
          if [[ -n "$thought" ]] && [[ $in_thinking -eq 0 ]]; then
            printf "\n${C_MAGENTA}${ICON_THINK} ${C_ITALIC}Analyzing...${C_RESET}" >&2
            in_thinking=1
          fi
        elif [[ "$subtype" == "completed" ]]; then
          if [[ $in_thinking -eq 1 ]]; then
            printf " ${C_DIM}done${C_RESET}\n" >&2
            in_thinking=0
          fi
        fi
        ;;

      "assistant")
        in_thinking=0
        local text=$(echo "$line" | jq -r '.message.content[0].text // empty' 2>/dev/null)
        if [[ -n "$text" ]]; then
          assistant_chars=$((assistant_chars + ${#text}))

          printf "\n" >&2
          printf "$(ts)${C_BRIGHT_BLUE}${BOX_TL}${BOX_H}${BOX_H} ${ICON_CHAT} ${C_BOLD}Test Discovery Agent${C_RESET}${C_BRIGHT_BLUE} ${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_TR}${C_RESET}\n" >&2
          printf "${C_BRIGHT_BLUE}${BOX_V}${C_RESET}\n" >&2
          while IFS= read -r msg_line; do
            printf "${C_BRIGHT_BLUE}${BOX_V}${C_RESET}  %s\n" "$msg_line" >&2
          done <<< "$text"
          printf "${C_BRIGHT_BLUE}${BOX_V}${C_RESET}\n" >&2
          printf "${C_BRIGHT_BLUE}${BOX_BL}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_BR}${C_RESET}\n" >&2
          log_activity "💬 AGENT: ${text:0:200}..."

          # Check for completion signals
          if [[ "$text" == *"<ralph>COMPLETE</ralph>"* ]]; then
            printf "\n${C_BG_GREEN}${C_BLACK}${C_BOLD} ${ICON_TEST} DISCOVERY COMPLETE ${C_RESET} ${C_GREEN}All modules analyzed!${C_RESET}\n" >&2
            log_activity "✅ Agent signaled COMPLETE"
            echo "COMPLETE"
          elif [[ "$text" == *"<ralph>NEXT</ralph>"* ]]; then
            printf "\n${C_CYAN}${C_BOLD}→ NEXT${C_RESET} ${C_DIM}Module analyzed, continuing...${C_RESET}\n" >&2
            log_activity "→ Agent signaled NEXT"
            echo "NEXT"
          elif [[ "$text" == *"<ralph>GUTTER</ralph>"* ]]; then
            printf "\n${C_BG_RED}${C_WHITE}${C_BOLD} ${ICON_ERROR} GUTTER ${C_RESET} ${C_RED}Agent is stuck - check activity.log${C_RESET}\n" >&2
            log_activity "🚨 Agent signaled GUTTER"
            echo "GUTTER"
          fi
        fi
        ;;

      "text")
        local delta=$(echo "$line" | jq -r '.content // empty' 2>/dev/null)
        if [[ -n "$delta" ]]; then
          printf "${C_WHITE}%s${C_RESET}" "$delta" >&2
          current_text+="$delta"
        fi
        ;;

      "tool_call")
        if [[ -n "$current_text" ]]; then
          echo "" >&2
          current_text=""
        fi

        if [[ "$subtype" == "started" ]]; then
          tool_start_time=$(date +%s)
          
          local tool_name=$(echo "$line" | jq -r '
            if .tool_call.readToolCall then "read"
            elif .tool_call.writeToolCall then "write"
            elif .tool_call.editToolCall then "edit"
            elif .tool_call.shellToolCall then "shell"
            elif .tool_call.searchToolCall then "search"
            elif .tool_call.globToolCall then "glob"
            elif .tool_call.grepToolCall then "grep"
            elif .tool_call.listFilesToolCall then "listFiles"
            else (.tool_call | keys[0] // "unknown")
            end
          ' 2>/dev/null)

          printf "\n" >&2
          
          case "$tool_name" in
            "read")
              local path=$(echo "$line" | jq -r '.tool_call.readToolCall.args.path // "?"' 2>/dev/null)
              printf "$(ts)${C_CYAN}${BOX_TL}${BOX_H}${BOX_H} ${ICON_READ} Read${C_RESET}\n" >&2
              printf "${C_CYAN}${BOX_V}${C_RESET}  " >&2
              format_path "$path" >&2
              printf "\n" >&2
              ;;
            "write")
              local path=$(echo "$line" | jq -r '.tool_call.writeToolCall.args.path // "?"' 2>/dev/null)
              printf "$(ts)${C_GREEN}${BOX_TL}${BOX_H}${BOX_H} ${ICON_WRITE}Write${C_RESET}\n" >&2
              printf "${C_GREEN}${BOX_V}${C_RESET}  " >&2
              format_path "$path" >&2
              printf "\n" >&2
              ;;
            "edit")
              local path=$(echo "$line" | jq -r '.tool_call.editToolCall.args.path // "?"' 2>/dev/null)
              printf "$(ts)${C_YELLOW}${BOX_TL}${BOX_H}${BOX_H} ${ICON_EDIT} Edit${C_RESET}\n" >&2
              printf "${C_YELLOW}${BOX_V}${C_RESET}  " >&2
              format_path "$path" >&2
              printf "\n" >&2
              ;;
            "shell")
              local cmd=$(echo "$line" | jq -r '.tool_call.shellToolCall.args.command // "?"' 2>/dev/null)
              printf "$(ts)${C_BRIGHT_MAGENTA}${BOX_TL}${BOX_H}${BOX_H} ${ICON_SHELL} Shell${C_RESET}\n" >&2
              printf "${C_BRIGHT_MAGENTA}${BOX_V}${C_RESET}  ${C_BRIGHT_WHITE}$ %s${C_RESET}\n" "$cmd" >&2
              ;;
            "search"|"glob"|"grep")
              local pattern=""
              if [[ "$tool_name" == "grep" ]]; then
                pattern=$(echo "$line" | jq -r '.tool_call.grepToolCall.args.pattern // "?"' 2>/dev/null)
              elif [[ "$tool_name" == "glob" ]]; then
                pattern=$(echo "$line" | jq -r '.tool_call.globToolCall.args.pattern // "?"' 2>/dev/null)
              fi
              printf "$(ts)${C_BRIGHT_CYAN}${BOX_TL}${BOX_H}${BOX_H} ${ICON_SEARCH} Search${C_RESET}\n" >&2
              [[ -n "$pattern" ]] && printf "${C_BRIGHT_CYAN}${BOX_V}${C_RESET}  ${C_DIM}Pattern:${C_RESET} %s\n" "$pattern" >&2
              ;;
            "listFiles")
              local path=$(echo "$line" | jq -r '.tool_call.listFilesToolCall.args.path // "?"' 2>/dev/null)
              printf "$(ts)${C_DIM}${BOX_TL}${BOX_H}${BOX_H} ${ICON_FOLDER} List${C_RESET}\n" >&2
              printf "${C_DIM}${BOX_V}${C_RESET}  " >&2
              format_path "$path" >&2
              printf "\n" >&2
              ;;
            *)
              printf "$(ts)${C_DIM}${BOX_TL}${BOX_H}${BOX_H} 🔧 %s${C_RESET}\n" "$tool_name" >&2
              ;;
          esac

        elif [[ "$subtype" == "completed" ]]; then
          local duration_sec=""
          if [[ -n "$tool_start_time" ]]; then
            local end_time=$(date +%s)
            duration_sec=$((end_time - tool_start_time))
          fi

          # Handle read tool result
          if echo "$line" | jq -e '.tool_call.readToolCall.result.success' > /dev/null 2>&1; then
            local lines=$(echo "$line" | jq -r '.tool_call.readToolCall.result.success.totalLines // 0' 2>/dev/null)
            local size=$(echo "$line" | jq -r '.tool_call.readToolCall.result.success.contentSize // 0' 2>/dev/null)
            bytes_read=$((bytes_read + size))
            
            printf "${C_CYAN}${BOX_V}${C_RESET}  ${C_GREEN}${ICON_SUCCESS}${C_RESET} ${C_DIM}%d lines${C_RESET} ${C_BRIGHT_BLACK}(%s)${C_RESET}" "$lines" "$(format_size $size)" >&2
            [[ -n "$duration_sec" ]] && [[ "$duration_sec" -gt 0 ]] && printf " ${C_BRIGHT_BLACK}%ds${C_RESET}" "$duration_sec" >&2
            printf "\n" >&2
            printf "${C_CYAN}${BOX_BL}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${C_RESET}\n" >&2

          # Handle write tool result
          elif echo "$line" | jq -e '.tool_call.writeToolCall.result.success' > /dev/null 2>&1; then
            local lines=$(echo "$line" | jq -r '.tool_call.writeToolCall.result.success.linesCreated // 0' 2>/dev/null)
            local size=$(echo "$line" | jq -r '.tool_call.writeToolCall.result.success.fileSize // 0' 2>/dev/null)
            bytes_written=$((bytes_written + size))
            
            printf "${C_GREEN}${BOX_V}${C_RESET}  ${C_GREEN}${ICON_SUCCESS}${C_RESET} ${C_DIM}Created %d lines${C_RESET} ${C_BRIGHT_BLACK}(%s)${C_RESET}" "$lines" "$(format_size $size)" >&2
            printf "\n" >&2
            printf "${C_GREEN}${BOX_BL}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${C_RESET}\n" >&2

          # Handle edit tool result
          elif echo "$line" | jq -e '.tool_call.editToolCall.result.success' > /dev/null 2>&1; then
            printf "${C_YELLOW}${BOX_V}${C_RESET}  ${C_GREEN}${ICON_SUCCESS}${C_RESET} ${C_DIM}Edit applied${C_RESET}\n" >&2
            printf "${C_YELLOW}${BOX_BL}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${C_RESET}\n" >&2

          # Handle shell tool result
          elif echo "$line" | jq -e '.tool_call.shellToolCall.result' > /dev/null 2>&1; then
            local exit_code=$(echo "$line" | jq -r '.tool_call.shellToolCall.result.exitCode // 0' 2>/dev/null)
            local stdout=$(echo "$line" | jq -r '.tool_call.shellToolCall.result.stdout // ""' 2>/dev/null)
            local stderr=$(echo "$line" | jq -r '.tool_call.shellToolCall.result.stderr // ""' 2>/dev/null)

            shell_chars=$((shell_chars + ${#stdout} + ${#stderr}))

            if [[ $exit_code -eq 0 ]]; then
              printf "${C_BRIGHT_MAGENTA}${BOX_V}${C_RESET}  ${C_GREEN}${ICON_SUCCESS} Exit 0${C_RESET}" >&2
            else
              printf "${C_BRIGHT_MAGENTA}${BOX_V}${C_RESET}  ${C_RED}${ICON_ERROR} Exit %d${C_RESET}" "$exit_code" >&2
            fi
            printf "\n" >&2
            printf "${C_BRIGHT_MAGENTA}${BOX_BL}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${C_RESET}\n" >&2

          # Handle search results
          elif echo "$line" | jq -e '.tool_call.searchToolCall.result // .tool_call.globToolCall.result // .tool_call.grepToolCall.result' > /dev/null 2>&1; then
            local results=$(echo "$line" | jq -r '
              .tool_call.searchToolCall.result.files // 
              .tool_call.globToolCall.result.files // 
              .tool_call.grepToolCall.result.matches // 
              [] | length
            ' 2>/dev/null)
            
            printf "${C_BRIGHT_CYAN}${BOX_V}${C_RESET}  ${C_GREEN}${ICON_SUCCESS}${C_RESET} ${C_DIM}Found ${C_BRIGHT_WHITE}%d${C_DIM} results${C_RESET}\n" "$results" >&2
            printf "${C_BRIGHT_CYAN}${BOX_BL}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${C_RESET}\n" >&2
          fi

          # Check token threshold
          local total_chars=$((bytes_read + bytes_written + assistant_chars + shell_chars + 3000))
          local tokens=$((total_chars / 4))

          if [[ $tokens -ge $ROTATE_THRESHOLD ]]; then
            printf "\n${C_BG_YELLOW}${C_BLACK}${C_BOLD} 🔄 CONTEXT ROTATION ${C_RESET} ${C_YELLOW}Token threshold reached (%d tokens)${C_RESET}\n" "$tokens" >&2
            log_activity "🔄 Token threshold reached ($tokens)"
            echo "ROTATE"
          elif [[ $tokens -ge $WARN_THRESHOLD ]] && [[ $warn_sent -eq 0 ]]; then
            printf "\n${C_YELLOW}${ICON_WARN}Approaching token limit (%d tokens)${C_RESET}\n" "$tokens" >&2
            warn_sent=1
            echo "WARN"
          fi
        fi
        ;;

      "error")
        local error_msg=$(echo "$line" | jq -r '.error.data.message // .error.message // .message // "Unknown error"' 2>/dev/null)
        
        printf "\n" >&2
        printf "$(ts)${C_BG_RED}${C_WHITE}${C_BOLD}  ERROR  ${C_RESET}\n" >&2
        printf "${C_RED} %s${C_RESET}\n" "$error_msg" >&2
        log_activity "❌ ERROR: $error_msg"

        if [[ "$error_msg" =~ (rate.?limit|429|timeout|connection|503|502|504|overloaded) ]]; then
          echo "DEFER"
        else
          echo "GUTTER"
        fi
        ;;

      "result")
        local duration=$(echo "$line" | jq -r '.duration_ms // 0' 2>/dev/null)
        local total_chars=$((bytes_read + bytes_written + assistant_chars + shell_chars + 3000))
        local tokens=$((total_chars / 4))
        
        printf "\n" >&2
        printf "$(ts)${C_DIM}${BOX_BL}${BOX_H}${BOX_H} Session Complete ${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${BOX_H}${C_RESET}\n" >&2
        printf "${C_DIM}  Duration: ${C_BRIGHT_WHITE}%dms${C_RESET}${C_DIM}  │  Tokens: ${C_BRIGHT_WHITE}~%d${C_RESET}\n" "$duration" "$tokens" >&2
        log_activity "SESSION END: ${duration}ms, ~$tokens tokens"
        ;;
    esac
  done

  echo "DONE"
}

# =============================================================================
# ITERATION RUNNER
# =============================================================================

run_iteration() {
  local iteration="$1"
  local prompt=$(build_prompt "$iteration")
  local completed=$(count_completed)
  local total=$(count_total)
  local remaining=$((total - completed))
  local test_cases=$(count_test_cases)

  # Calculate progress bar
  local progress_pct=0
  [[ $total -gt 0 ]] && progress_pct=$((completed * 100 / total))
  local bar_width=30
  local filled=$((progress_pct * bar_width / 100))
  local empty=$((bar_width - filled))

  echo ""
  printf "${C_BRIGHT_CYAN}╔════════════════════════════════════════════════════════════════════╗${C_RESET}\n"
  printf "${C_BRIGHT_CYAN}║${C_RESET}  ${C_BOLD}${ICON_TEST} Ralph Test Discovery${C_RESET} ${C_DIM}│${C_RESET} Iteration ${C_BRIGHT_WHITE}${C_BOLD}%d${C_RESET}                          ${C_BRIGHT_CYAN}║${C_RESET}\n" "$iteration"
  printf "${C_BRIGHT_CYAN}╠════════════════════════════════════════════════════════════════════╣${C_RESET}\n"
  printf "${C_BRIGHT_CYAN}║${C_RESET}  ${C_DIM}Model:${C_RESET}       ${C_BRIGHT_WHITE}%-43s${C_RESET}       ${C_BRIGHT_CYAN}║${C_RESET}\n" "$MODEL"
  printf "${C_BRIGHT_CYAN}║${C_RESET}  ${C_DIM}Modules:${C_RESET}     ${C_GREEN}%d${C_RESET}/${C_BRIGHT_WHITE}%d${C_RESET} analyzed ${C_DIM}(%d remaining)${C_RESET}                      ${C_BRIGHT_CYAN}║${C_RESET}\n" "$completed" "$total" "$remaining"
  printf "${C_BRIGHT_CYAN}║${C_RESET}  ${C_DIM}Test Cases:${C_RESET}  ${C_BRIGHT_WHITE}%d${C_RESET} created                                          ${C_BRIGHT_CYAN}║${C_RESET}\n" "$test_cases"
  printf "${C_BRIGHT_CYAN}║${C_RESET}  ${C_DIM}Progress:${C_RESET}    [${C_GREEN}%s${C_RESET}${C_DIM}%s${C_RESET}] ${C_BRIGHT_WHITE}%d%%${C_RESET}                              ${C_BRIGHT_CYAN}║${C_RESET}\n" "$(printf '█%.0s' $(seq 1 $filled 2>/dev/null) 2>/dev/null)" "$(printf '░%.0s' $(seq 1 $empty 2>/dev/null) 2>/dev/null)" "$progress_pct"
  printf "${C_BRIGHT_CYAN}╚════════════════════════════════════════════════════════════════════╝${C_RESET}\n"
  echo ""

  log_activity "SESSION $iteration START: model=$MODEL"
  log_progress "**Session $iteration started** (model: $MODEL)"

  # Capture knowledge state BEFORE iteration
  local knowledge_before=""
  if [[ -f "$WORKSPACE/$KNOWLEDGE_FILE" ]]; then
    knowledge_before=$(md5 -q "$WORKSPACE/$KNOWLEDGE_FILE" 2>/dev/null || md5sum "$WORKSPACE/$KNOWLEDGE_FILE" | cut -d' ' -f1)
  fi

  # Run cursor-agent and parse output
  local signal=""
  local fifo="$WORKSPACE/$RALPH_DIR/.parser_fifo_$$"
  local watchdog_file="$WORKSPACE/$RALPH_DIR/.watchdog_$$"

  rm -f "$fifo" "$watchdog_file"
  mkfifo "$fifo"

  local iteration_start=$(date +%s)
  echo "$iteration_start" > "$watchdog_file"

  # Start agent
  (
    cd "$WORKSPACE"
    cursor-agent -p --force --output-format stream-json --model "$MODEL" "$prompt" 2>&1 | parse_stream > "$fifo"
  ) &
  local agent_pid=$!

  # Watchdog process
  (
    while true; do
      sleep 60
      
      if ! kill -0 $agent_pid 2>/dev/null; then
        break
      fi
      
      local now=$(date +%s)
      local start=$(cat "$watchdog_file" 2>/dev/null || echo "$now")
      local elapsed=$((now - start))
      
      if [[ $elapsed -ge $AGENT_TIMEOUT ]]; then
        local timeout_mins=$((AGENT_TIMEOUT / 60))
        printf "\n${C_BG_YELLOW}${C_BLACK}${C_BOLD} ⏰ TIMEOUT ${C_RESET} ${C_YELLOW}Agent stuck for ${timeout_mins}+ minutes. Restarting...${C_RESET}\n" >&2
        log_activity "⏰ TIMEOUT: Agent killed after ${elapsed}s"
        
        pkill -P $agent_pid 2>/dev/null || true
        kill -9 $agent_pid 2>/dev/null || true
        
        echo "TIMEOUT" > "$fifo" 2>/dev/null || true
        break
      fi
      
      touch "$watchdog_file"
    done
  ) &
  local watchdog_pid=$!

  # Read signals from parser
  while IFS= read -r line; do
    echo "$(date +%s)" > "$watchdog_file" 2>/dev/null || true
    
    case "$line" in
      COMPLETE|GUTTER|ROTATE|DEFER|NEXT)
        signal="$line"
        kill $agent_pid 2>/dev/null || true
        break
        ;;
      TIMEOUT)
        signal="TIMEOUT"
        break
        ;;
      WARN)
        echo "⚠️ Context warning - agent should wrap up soon..."
        ;;
      DONE)
        signal="DONE"
        break
        ;;
    esac
  done < "$fifo"

  # Cleanup
  kill $watchdog_pid 2>/dev/null || true
  wait $agent_pid 2>/dev/null || true
  wait $watchdog_pid 2>/dev/null || true
  rm -f "$fifo" "$watchdog_file"

  # Check if knowledge was updated
  local knowledge_after=""
  if [[ -f "$WORKSPACE/$KNOWLEDGE_FILE" ]]; then
    knowledge_after=$(md5 -q "$WORKSPACE/$KNOWLEDGE_FILE" 2>/dev/null || md5sum "$WORKSPACE/$KNOWLEDGE_FILE" | cut -d' ' -f1)
  fi

  if [[ -n "$knowledge_before" ]] && [[ -n "$knowledge_after" ]] && [[ "$knowledge_before" != "$knowledge_after" ]]; then
    printf "\n${C_GREEN}${ICON_SUCCESS} Knowledge base updated${C_RESET}\n"
    log_activity "🧠 Knowledge updated"
  fi

  echo "$signal"
}

# =============================================================================
# MAIN LOOP
# =============================================================================

run_loop() {
  cd "$WORKSPACE"

  echo ""
  printf "${C_BRIGHT_GREEN}🔍 Starting Test Discovery Loop...${C_RESET}\n"
  printf "${C_DIM}   Modules: ${C_GREEN}%d${C_DIM}/${C_BRIGHT_WHITE}%d${C_DIM} analyzed${C_RESET}\n" "$(count_completed)" "$(count_total)"
  printf "${C_DIM}   Test Cases: ${C_BRIGHT_WHITE}%d${C_DIM} created${C_RESET}\n" "$(count_test_cases)"
  echo ""

  local iteration=1
  local current_task_id=""

  while [[ $iteration -le $MAX_ITERATIONS ]]; do
    # Check if already complete
    if is_complete; then
      local test_cases=$(count_test_cases)
      echo ""
      printf "${C_BG_GREEN}${C_BLACK}${C_BOLD}                                                                       ${C_RESET}\n"
      printf "${C_BG_GREEN}${C_BLACK}${C_BOLD}  ${ICON_TEST} TEST DISCOVERY COMPLETE!                                        ${C_RESET}\n"
      printf "${C_BG_GREEN}${C_BLACK}${C_BOLD}  All modules analyzed. %d test cases created.                         ${C_RESET}\n" "$test_cases"
      printf "${C_BG_GREEN}${C_BLACK}${C_BOLD}                                                                       ${C_RESET}\n"
      log_progress "**COMPLETE** after $iteration iterations - $test_cases test cases"
      return 0
    fi

    # Check for task change
    local next_task_info=$(get_next_task)
    local next_task_id=""
    if [[ -n "$next_task_info" ]]; then
      next_task_id=$(echo "$next_task_info" | cut -d'|' -f1)
    fi
    
    if [[ -n "$current_task_id" ]] && [[ -n "$next_task_id" ]] && [[ "$current_task_id" != "$next_task_id" ]]; then
      printf "\n${C_CYAN}📋 New module: ${C_BRIGHT_WHITE}%s${C_RESET}\n" "$next_task_id"
      iteration=$((iteration + 1))
    fi
    
    current_task_id="$next_task_id"

    # Run iteration
    local signal=$(run_iteration "$iteration")

    # Check completion after iteration
    if is_complete; then
      local test_cases=$(count_test_cases)
      echo ""
      printf "${C_BG_GREEN}${C_BLACK}${C_BOLD}                                                                       ${C_RESET}\n"
      printf "${C_BG_GREEN}${C_BLACK}${C_BOLD}  ${ICON_TEST} TEST DISCOVERY COMPLETE!                                        ${C_RESET}\n"
      printf "${C_BG_GREEN}${C_BLACK}${C_BOLD}  All modules analyzed in %d iterations. %d test cases.                ${C_RESET}\n" "$iteration" "$test_cases"
      printf "${C_BG_GREEN}${C_BLACK}${C_BOLD}                                                                       ${C_RESET}\n"
      log_progress "**COMPLETE** after $iteration iterations - $test_cases test cases"
      return 0
    fi

    # Handle signal
    case "$signal" in
      COMPLETE)
        if is_complete; then
          log_progress "**Session $iteration ended** - ✅ COMPLETE"
          return 0
        else
          printf "${C_YELLOW}${ICON_WARN}Agent signaled complete but tasks remain. Continuing...${C_RESET}\n"
          iteration=$((iteration + 1))
        fi
        ;;
      NEXT)
        log_progress "**Session $iteration ended** - → NEXT"
        printf "\n${C_CYAN}→ Continuing discovery...${C_RESET}\n"
        iteration=$((iteration + 1))
        ;;
      ROTATE)
        log_progress "**Session $iteration ended** - 🔄 Context rotation"
        printf "\n${C_CYAN}🔄 Rotating to fresh context...${C_RESET}\n"
        iteration=$((iteration + 1))
        ;;
      GUTTER)
        log_progress "**Session $iteration ended** - 🚨 GUTTER"
        printf "\n${C_BG_RED}${C_WHITE}${C_BOLD} 🚨 GUTTER ${C_RESET} ${C_RED}Agent stuck. Check activity.log${C_RESET}\n"
        return 1
        ;;
      DEFER)
        log_progress "**Session $iteration ended** - ⏸️ Rate limit"
        local delay=$((15 * iteration))
        [[ $delay -gt 120 ]] && delay=120
        printf "\n${C_YELLOW}⏸️ Rate limit. Waiting %ds...${C_RESET}\n" "$delay"
        sleep $delay
        ;;
      TIMEOUT)
        log_progress "**Session $iteration ended** - ⏰ TIMEOUT"
        printf "\n${C_YELLOW}⏰ Restarting with fresh context...${C_RESET}\n"
        iteration=$((iteration + 1))
        sleep 5
        ;;
      *)
        local remaining=$(count_remaining)
        if [[ $remaining -gt 0 ]]; then
          log_progress "**Session $iteration ended** - $remaining modules remaining"
          printf "\n${C_YELLOW}${ICON_WARN}%d modules remaining. Continuing...${C_RESET}\n" "$remaining"
          iteration=$((iteration + 1))
        fi
        ;;
    esac

    sleep 2
  done

  log_progress "**Loop ended** - ⚠️ Max iterations reached"
  printf "\n${C_YELLOW}${ICON_WARN}Max iterations (%d) reached.${C_RESET}\n" "$MAX_ITERATIONS"
  return 1
}

# =============================================================================
# MAIN
# =============================================================================

main() {
  parse_args "$@"

  # Resolve workspace path
  WORKSPACE="$(cd "$WORKSPACE" && pwd)"

  # Banner
  echo ""
  printf "${C_BRIGHT_CYAN}"
  echo "╔═══════════════════════════════════════════════════════════════════╗"
  echo "║                                                                   ║"
  echo "║   🧪  Ralph Test Discovery Loop                                   ║"
  echo "║   Analyzing code + Live testing → Creating test case definitions  ║"
  echo "║                                                                   ║"
  echo "╚═══════════════════════════════════════════════════════════════════╝"
  printf "${C_RESET}\n"

  # Check prerequisites
  if ! check_prerequisites; then
    exit 1
  fi

  # Initialize
  init_ralph

  # Show summary
  local completed=$(count_completed)
  local total=$(count_total)
  local remaining=$((total - completed))
  local test_cases=$(count_test_cases)
  
  printf "${C_DIM}┌─────────────────────────────────────────────────────────────────────┐${C_RESET}\n"
  printf "${C_DIM}│${C_RESET}  ${C_DIM}Workspace:${C_RESET}   ${C_BRIGHT_WHITE}%s${C_RESET}\n" "$WORKSPACE"
  printf "${C_DIM}│${C_RESET}  ${C_DIM}Model:${C_RESET}       ${C_BRIGHT_CYAN}%s${C_RESET}\n" "$MODEL"
  printf "${C_DIM}│${C_RESET}  ${C_DIM}Iterations:${C_RESET}  ${C_BRIGHT_WHITE}%d${C_RESET} ${C_DIM}max${C_RESET}\n" "$MAX_ITERATIONS"
  local timeout_mins=$((AGENT_TIMEOUT / 60))
  printf "${C_DIM}│${C_RESET}  ${C_DIM}Timeout:${C_RESET}     ${C_BRIGHT_WHITE}%d${C_RESET} ${C_DIM}min${C_RESET}\n" "$timeout_mins"
  printf "${C_DIM}├─────────────────────────────────────────────────────────────────────┤${C_RESET}\n"
  printf "${C_DIM}│${C_RESET}  ${C_DIM}Modules:${C_RESET}     ${C_GREEN}%d${C_RESET}/${C_BRIGHT_WHITE}%d${C_RESET} analyzed ${C_DIM}(%d remaining)${C_RESET}\n" "$completed" "$total" "$remaining"
  printf "${C_DIM}│${C_RESET}  ${C_DIM}Test Cases:${C_RESET}  ${C_BRIGHT_WHITE}%d${C_RESET} created\n" "$test_cases"
  printf "${C_DIM}└─────────────────────────────────────────────────────────────────────┘${C_RESET}\n"
  echo ""

  # Check if already complete
  if is_complete && [[ $(count_total) -gt 0 ]]; then
    printf "${C_GREEN}🎉 All modules already analyzed! %d test cases exist.${C_RESET}\n" "$test_cases"
    exit 0
  fi

  # Run the loop
  run_loop
}

main "$@"
