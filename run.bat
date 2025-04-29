@echo off
set DIR_PATH=public\images
set TEMP_DIR=temp\stickers
set CLOUD_NAME= "dlaoxrnad"
set API_KEY= "527615582374857"
set API_SECRET= "15KO2h9761F2QNoj1taROHh5Q4Q"

echo Running split_sprite.py...
python scripts\split_sprite.py %DIR_PATH% %TEMP_DIR% %CLOUD_NAME% %API_KEY% %API_SECRET%
pause

{/*.\run.bat chạy trong terminal để tiến hành cắt hả*/}