@echo off
setlocal
if not exist "%JAVA_HOME%\bin\java.exe" (
  if exist "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.7-hotspot\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.4.7-hotspot"
  ) else (
    for /d %%i in ("C:\Program Files\Eclipse Adoptium\jdk*") do if exist "%%i\bin\java.exe" set "JAVA_HOME=%%i"
    if not exist "%JAVA_HOME%\bin\java.exe" for /d %%i in ("C:\Program Files\Java\jdk*") do if exist "%%i\bin\java.exe" set "JAVA_HOME=%%i"
  )
)
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo JAVA_HOME is not set to a valid JDK.
  exit /b 1
)

set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"
set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar

if not exist "%WRAPPER_JAR%" (
  powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%WRAPPER_URL%', '%WRAPPER_JAR%')"
)

"%JAVA_HOME%\bin\java.exe" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
endlocal
