#!/usr/bin/env bash
# Recreates the state after a review: the reviewed version committed, the user's fix uncommitted.
set -eu
here="$(dirname "$0")/files"
cp -R "$here/." .
git init -q
cp store.v1.py store.py
git add store.py
git -c user.name=eval -c user.email=eval@example.com commit -qm "first version of store.py"
cp store.v2.py store.py
rm store.v1.py store.v2.py
