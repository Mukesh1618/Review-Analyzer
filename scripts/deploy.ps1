param (
    [string]$Environment = "dev",
    [string]$TerraformVarsFile = "dev.tfvars",
    [string]$AppName = "review-analyzer"
)

# Force UTF-8 encoding to prevent Azure CLI UnicodeEncodeError crashes (e.g. checkmarks from Vite)
[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$env:PYTHONIOENCODING="utf-8"

Write-Host "Starting deployment for $AppName to $Environment environment..." -ForegroundColor Cyan

# 1. Check for required tools
$requiredTools = @("terraform", "az")
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "$tool is not installed or not in PATH."
        exit 1
    }
}

# 2. Check Azure login
$azAccount = az account show --query "user.name" -o tsv 2>$null
if (-not $azAccount) {
    Write-Host "Not logged into Azure. Running 'az login'..." -ForegroundColor Yellow
    az login | Out-Null
}

# 3. Read Grok credentials from .env to pass to Terraform
$envFile = "..\.env"
if (-not (Test-Path $envFile)) {
    Write-Error "Cannot find .env file. Please create one with GROK_API_KEY and GROK_API_BASE."
    exit 1
}

$grokApiKey = ""
$grokApiBase = ""
$grokModelName = "grok-4-1-fast-reasoning"

foreach ($line in Get-Content $envFile) {
    if ($line -match "^GROK_API_KEY=(.*)$") { $grokApiKey = $matches[1].Trim('"', "'") }
    if ($line -match "^GROK_API_BASE=(.*)$") { $grokApiBase = $matches[1].Trim('"', "'") }
    if ($line -match "^GROK_MODEL_NAME=(.*)$") { $grokModelName = $matches[1].Trim('"', "'") }
}

if (-not $grokApiKey -or -not $grokApiBase) {
    Write-Error "GROK_API_KEY and GROK_API_BASE must be set in .env"
    exit 1
}

# 4. Run Terraform to create infrastructure and get ACR details
Set-Location -Path "..\terraform"

Write-Host "Initializing Terraform..." -ForegroundColor Cyan
terraform init

Write-Host "Applying Terraform (Phase 1: ACR only)..." -ForegroundColor Cyan
terraform apply -target "azurerm_resource_group.rg" -target "azurerm_container_registry.acr" -auto-approve `
    -var="environment=$Environment" `
    -var="app_name=$AppName" `
    -var="grok_api_key=$grokApiKey" `
    -var="grok_api_base=$grokApiBase" `
    -var="grok_model_name=$grokModelName"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Terraform Phase 1 failed."
    exit 1
}

# Get the ACR login server and Container App FQDN from Terraform state
$acrLoginServer = terraform state show azurerm_container_registry.acr | Select-String "login_server\s+=" | ForEach-Object { $_.ToString().Split('=')[1].Trim().Trim('"') }
$acrName = terraform state show azurerm_container_registry.acr | Select-String -Pattern "^    name\s+=" | ForEach-Object { $_.ToString().Split('=')[1].Trim().Trim('"') }

# 5. Build and Push Docker Image via Azure Container Registry (Remote Build)
Set-Location -Path "..\"

Write-Host "Triggering remote Docker build in Azure Container Registry ($acrName)..." -ForegroundColor Cyan
$imageTag = "$acrLoginServer/$AppName`:$Environment"

az acr build --registry $acrName --image $imageTag .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Azure ACR build failed."
    exit 1
}

# 6. Apply remaining Terraform infrastructure (Container App)
Set-Location -Path ".\terraform"
Write-Host "Applying Terraform (Phase 2: Container App)..." -ForegroundColor Cyan
terraform apply -auto-approve `
    -var="environment=$Environment" `
    -var="app_name=$AppName" `
    -var="grok_api_key=$grokApiKey" `
    -var="grok_api_base=$grokApiBase" `
    -var="grok_model_name=$grokModelName"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Terraform Phase 2 failed."
    exit 1
}

# 6. Restart Container App to pull new image (optional, as ACA often auto-updates on :latest, but good practice for specific tags if using them)
# Wait for the revision to be created, Azure handles this when the image updates if we trigger a revision, but easiest way is just to force a new revision if needed.
# Since we deployed with Terraform, the image is already set. We can trigger an update by restarting or letting ACA pull the new image.
Write-Host "Deployment completed successfully! 🚀" -ForegroundColor Green

Set-Location -Path ".\terraform"
$fqdn = terraform output -raw app_fqdn
$verificationId = terraform output -raw custom_domain_verification_id

Write-Host "=========================================================" -ForegroundColor Yellow
Write-Host "                 IMPORTANT DNS RECORDS                   " -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Yellow
Write-Host "Add these to GoDaddy to link your custom domain:"
Write-Host "1. TXT Record:"
Write-Host "   Name:  asuid"
Write-Host "   Value: $verificationId"
Write-Host ""
Write-Host "2. CNAME Record:"
Write-Host "   Name:  (your subdomain, e.g. www, reviewmind, etc)"
Write-Host "   Value: $fqdn"
Write-Host "=========================================================" -ForegroundColor Yellow

Set-Location -Path "..\"
