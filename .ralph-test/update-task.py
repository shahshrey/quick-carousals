#!/usr/bin/env python3
"""Update task status to complete"""

import json

with open('.ralph-test/tasks.json', 'r') as f:
    tasks = json.load(f)

# Find and update discovery-15
for task in tasks:
    if task['id'] == 'discovery-15':
        task['passes'] = True
        break

with open('.ralph-test/tasks.json', 'w') as f:
    json.dump(tasks, f, indent=2)

print("✅ Updated discovery-15 task to passes=true")
