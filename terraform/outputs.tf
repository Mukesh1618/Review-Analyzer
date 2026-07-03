output "app_fqdn" {
  description = "The fully qualified domain name (FQDN) of the deployed Container App. Use this as your CNAME record value in GoDaddy."
  value       = azurerm_container_app.app.latest_revision_fqdn
}

output "custom_domain_verification_id" {
  description = "The Custom Domain Verification ID. Add this as a TXT record with name 'asuid' to GoDaddy."
  value       = azurerm_container_app.app.custom_domain_verification_id
}
