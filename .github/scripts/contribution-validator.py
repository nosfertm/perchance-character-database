# contribution-validator.py
import os
import json
import jsonschema
import yaml

class ContributionValidator:
    def __init__(self, contribution_path):
        """
        Initialize validator with contribution path.
        
        :param contribution_path: Path to the contribution files
        """
        self.contribution_path = contribution_path
        self.categories = self.load_categories()

    def load_categories(self):
        """
        Load available categories from categories.json.
        
        :return: Dictionary of available categories
        """
        with open('categories.json', 'r') as f:
            return json.load(f)

    def validate_manifest_schema(self, manifest_path):
        """
        Validate manifest against a predefined schema.
        
        :param manifest_path: Path to manifest.json
        :return: Boolean indicating validation result
        """
        # TODO: Define comprehensive JSON schema
        schema = {
            "type": "object",
            "required": ["name", "description", "author"],
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "author": {"type": "string"}
            }
        }

        with open(manifest_path, 'r') as f:
            manifest = json.load(f)

        try:
            jsonschema.validate(instance=manifest, schema=schema)
            return True
        except jsonschema.exceptions.ValidationError as e:
            print(f"Manifest validation error: {e}")
            return False

    def validate_categories(self, manifest_path):
        """
        Check if categories in manifest match available categories.
        
        :param manifest_path: Path to manifest.json
        :return: Boolean indicating category validation result
        """
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        categories = manifest.get('categories', {})
        
        for category_type, values in categories.items():
            if not isinstance(values, list):
                values = [values]
            
            # Check if all category values are valid
            available_categories = self.categories.get(category_type, [])
            for value in values:
                if value not in available_categories:
                    print(f"Invalid category: {value} for type {category_type}")
                    return False
        
        return True

    def validate_contribution(self):
        """
        Perform comprehensive validation of the contribution.
        
        :return: Boolean indicating overall validation result
        """
        manifest_path = os.path.join(self.contribution_path, 'manifest.json')
        
        if not os.path.exists(manifest_path):
            print("Manifest file not found on:" + manifest_path)
            return False
        
        manifest_valid = self.validate_manifest_schema(manifest_path)
        categories_valid = self.validate_categories(manifest_path)
        
        return manifest_valid and categories_valid

def main():
    # TODO: Update to detect contribution type and path dynamically
    contribution_path = os.environ.get('CONTRIBUTION_PATH', '.')
    
    validator = ContributionValidator(contribution_path)
    validation_result = validator.validate_contribution()
    
    # Exit with appropriate status code
    exit(0 if validation_result else 1)

if __name__ == '__main__':
    main()
