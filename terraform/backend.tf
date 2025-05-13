# State bucket
terraform {
  backend "s3" {
    bucket       = "30-seconds-game"
    key          = "30-seconds-game/terraform.tfstate"
    region       = "af-south-1"
    use_lockfile = true
    encrypt      = true
  }
}
