#!/usr/bin/env python3
"""Merge rewrite test cases into tests.json"""

import json
import sys

# Read existing tests
with open('.ralph-test/tests.json', 'r') as f:
    tests_data = json.load(f)

# Read new rewrite tests
with open('.ralph-test/rewrite-tests.json', 'r') as f:
    rewrite_tests = json.load(f)

# Insert new tests before known_issues section
# Find the index to insert (just before known_issues)
tests_data['test_cases'].extend(rewrite_tests)

# Update module status and count
tests_data['modules']['rewrite']['status'] = 'analyzed'
tests_data['modules']['rewrite']['test_count'] = len(rewrite_tests)

# Update metadata counts
tests_data['metadata']['coverage_summary']['total_tests'] += len(rewrite_tests)
tests_data['metadata']['coverage_summary']['modules_analyzed'] += 1
tests_data['metadata']['coverage_summary']['total_test_cases'] += len(rewrite_tests)

# Update by_priority
for test in rewrite_tests:
    priority = test['priority']
    tests_data['metadata']['coverage_summary']['by_priority'][priority] += 1

# Update by_category
for test in rewrite_tests:
    category = test['category']
    tests_data['metadata']['coverage_summary']['by_category'][category] += 1

# Update timestamp
import time
tests_data['metadata']['last_updated'] = time.time()

# Write updated tests
with open('.ralph-test/tests.json', 'w') as f:
    json.dump(tests_data, f, indent=2)

print(f"✅ Successfully added {len(rewrite_tests)} test cases for rewrite module")
print(f"   Total test cases: {tests_data['metadata']['coverage_summary']['total_test_cases']}")
print(f"   Modules analyzed: {tests_data['metadata']['coverage_summary']['modules_analyzed']}/20")
