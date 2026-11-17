#!/usr/bin/env bash
set -eu
# Same project as fixes-code-keeps-tests-green; only the allowed tools differ.
cp -R "$(dirname "$0")/../reviews-planted-bugs/files/." .
cp -R "$(dirname "$0")/../fixes-code-keeps-tests-green/files/." .
