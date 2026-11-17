#!/usr/bin/env bash
set -eu
# The planted-bug fixture is shared with reviews-planted-bugs; the tests are this case's own.
cp -R "$(dirname "$0")/../reviews-planted-bugs/files/." .
cp -R "$(dirname "$0")/files/." .
