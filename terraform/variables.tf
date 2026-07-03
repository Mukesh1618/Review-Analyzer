variable "environment" {
  description = "The environment (e.g. dev, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "The Azure region to deploy resources in"
  type        = string
  default     = "eastus2"
}

variable "app_name" {
  description = "The base name of the application"
  type        = string
  default     = "review-analyzer"
}

# AI Foundry / LLM configuration
variable "grok_api_key" {
  description = "API Key for Grok custom deployment on Azure"
  type        = string
  sensitive   = true
}

variable "grok_api_base" {
  description = "API Base URL for Grok custom deployment"
  type        = string
}

variable "grok_model_name" {
  description = "The Grok model name (e.g. grok-4-1-fast-reasoning)"
  type        = string
  default     = "grok-4-1-fast-reasoning"
}
