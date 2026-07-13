terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Generate a random suffix for unique resource names
resource "random_pet" "suffix" {
  length = 2
}

locals {
  safe_name = "${var.app_name}-${var.environment}-${random_pet.suffix.id}"
  st_name_raw = replace(lower("st${var.app_name}${var.environment}${random_pet.suffix.id}"), "-", "")
  storage_account_name = substr(local.st_name_raw, 0, 24)
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "rg-${local.safe_name}"
  location = var.location
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = replace("acr${local.safe_name}", "-", "")
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# Log Analytics Workspace for Container Apps
resource "azurerm_log_analytics_workspace" "log_analytics" {
  name                = "law-${local.safe_name}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Container App Environment
resource "azurerm_container_app_environment" "env" {
  name                       = "cae-${local.safe_name}"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log_analytics.id
}

# Storage Account for persistent data
resource "azurerm_storage_account" "storage" {
  name                     = local.storage_account_name
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# File Share for ReviewMind Data
resource "azurerm_storage_share" "fileshare" {
  name                 = "reviewmind-data"
  storage_account_name = azurerm_storage_account.storage.name
  quota                = 50
}

# Link File Share to Container App Environment
resource "azurerm_container_app_environment_storage" "env_storage" {
  name                         = "reviewmindstorage"
  container_app_environment_id = azurerm_container_app_environment.env.id
  account_name                 = azurerm_storage_account.storage.name
  share_name                   = azurerm_storage_share.fileshare.name
  access_key                   = azurerm_storage_account.storage.primary_access_key
  access_mode                  = "ReadWrite"
}

# Container App
resource "azurerm_container_app" "app" {
  name                         = "ca-${var.environment}-${random_pet.suffix.id}"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  # Secrets Configuration
  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }
  
  secret {
    name  = "grok-api-key"
    value = var.grok_api_key
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 80
    
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    container {
      name   = "app"
      image  = "${azurerm_container_registry.acr.login_server}/${var.app_name}:${var.environment}"
      cpu    = 0.5
      memory = "1.0Gi"
      
      env {
        name  = "GROK_API_KEY"
        secret_name = "grok-api-key"
      }
      env {
        name  = "GROK_API_BASE"
        value = var.grok_api_base
      }
      env {
        name  = "GROK_MODEL_NAME"
        value = var.grok_model_name
      }
      # Required for FastAPI behind Azure proxy
      env {
        name  = "FORWARDED_ALLOW_IPS"
        value = "*"
      }

      volume_mounts {
        name = "data-volume"
        path = "/app/data"
      }
    }

    volume {
      name         = "data-volume"
      storage_name = azurerm_container_app_environment_storage.env_storage.name
      storage_type = "AzureFile"
    }
  }
}
