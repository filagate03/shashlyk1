@echo off
setlocal
echo Installing dependencies for backend and web-app...
pushd backend
call npm install
popd
pushd web-app
call npm install
popd
echo Done.

