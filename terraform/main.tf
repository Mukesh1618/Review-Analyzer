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

# Container App
resource "azurerm_container_app" "app" {
  name                         = "ca-${local.safe_name}"
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
    }
  }
}
