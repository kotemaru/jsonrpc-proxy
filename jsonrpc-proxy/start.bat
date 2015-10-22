
set NODE_EXE="C:\Program Files\nodejs\node.exe"

set BASE=%~dp0

cd /d %BASE%


mkdir docroot\logs
%NODE_EXE% app.js

pause