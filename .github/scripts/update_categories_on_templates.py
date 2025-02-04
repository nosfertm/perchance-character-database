# Loads categories from categories.json and updates template issues
# .github/scripts/update_categories_on_templates.py
import json
import re
import os
from typing import Dict, List
import sys

class TemplateUpdater:
    """
    Class to handle template updates based on categories.json
    """
    def __init__(self):
        print("Initializing TemplateUpdater...")
        self.categories = self.load_categories()
        self.template_dir = '.github/ISSUE_TEMPLATE'
        
    def load_categories(self) -> List[Dict]:
        """
        Load and parse the categories.json file
        
        Returns:
            List[Dict]: List of category configurations
        """
        try:
            print("Loading categories.json...")
            with open('categories.json', 'r') as f:
                categories = json.load(f)
            print(f"Successfully loaded {len(categories)} categories")
            return categories
        except FileNotFoundError:
            print("ERROR: categories.json not found!")
            sys.exit(1)
        except json.JSONDecodeError:
            print("ERROR: Invalid JSON in categories.json!")
            sys.exit(1)
    
    def ensure_directory_exists(self):
        """
        Ensure the template directory exists
        """
        try:
            print(f"Ensuring directory exists: {self.template_dir}")
            os.makedirs(self.template_dir, exist_ok=True)
            print("Directory check completed")
        except Exception as e:
            print(f"ERROR: Failed to create directory: {e}")
            sys.exit(1)
    
    def generate_category_yaml(self, category: Dict) -> str:
        """
        Generate YAML for a single category dropdown
        
        Args:
            category (Dict): Category information from categories.json
        
        Returns:
            str: YAML formatted dropdown for the category
        """
        print(f"Generating YAML for category: {category['name']}")
        
        # Combine general and nsfw tags into a single list
        all_tags = category['tags']['general'] + category['tags']['nsfw']
        
        # Generate the YAML structure
        yaml = f"""  - type: dropdown
    id: {category['name'].lower()}
    attributes:
      label: {category['name']}
      description: {category['description']}
      multiple: true
      options:
"""
        # Add each tag as an option
        for tag in sorted(all_tags):
            yaml += f"        - {tag}\n"
        
        # Add required validation if category is required
        yaml += "    validations:\n"
        yaml += f"      required: {str(category['required']).lower()}\n"
        
        return yaml
    
    def generate_category_request_options(self) -> str:
        """
        Generate the options list for category request template
        
        Returns:
            str: YAML formatted options for existing categories dropdown
        """
        print("Generating category request options...")
        yaml = "        - None (New Category)\n"
        for category in self.categories:
            yaml += f"        - {category['name']}\n"
        return yaml
    
    def update_contribution_template(self, skipRating: bool = True):
        """
        Update the contribution template with current categories
        
        Args:
            skipRating (bool): If True, skip the Rating category when generating template
        """
        template_path = f"{self.template_dir}/contribution.yaml"
        print(f"Updating contribution template: {template_path}")
        
        try:
            # Generate categories section
            categories_yaml = ""
            for category in self.categories:
                # Skip Rating category if skipRating is True
                if skipRating and category['name'] == 'Rating':
                    continue
                categories_yaml += self.generate_category_yaml(category) + "\n"
                
            # Read existing template
            if os.path.exists(template_path):
                with open(template_path, 'r') as f:
                    template = f.read()
                print("Successfully read existing contribution template")
            else:
                print("ERROR: Contribution template not found!")
                sys.exit(1)
                
            # Replace the categories section
            new_template = re.sub(
                r'  # BEGIN_CATEGORIES.*?  # END_CATEGORIES',
                f'  # BEGIN_CATEGORIES\n{categories_yaml.rstrip()}\n  # END_CATEGORIES',
                template,
                flags=re.DOTALL
            )
            
            # Save the updated template
            with open(template_path, 'w') as f:
                f.write(new_template)
            print("Successfully updated contribution template")
            
        except Exception as e:
            print(f"ERROR: Failed to update contribution template: {e}")
            sys.exit(1)

            
    def update_category_request_template(self):
        """
        Update the category request template with current categories
        """
        template_path = f"{self.template_dir}/category-tag-request.yaml"
        print(f"Updating category request template: {template_path}")
        
        try:
            # Generate the full dropdown structure with updated categories
            # Note: YAML indentation is 2 spaces for each level
            categories_dropdown = """  - type: dropdown
    id: existing-category
    attributes:
      label: Existing Category
      description: Select an existing category, or leave at 'None' to add a new one.
      options:
        - None (New Category)"""
            
            # Add each category as an option with proper indentation
            for category in self.categories:
                categories_dropdown += f"\n        - {category['name']}"
                
            # Add the required validation with proper indentation
            categories_dropdown += """
    validations:
      required: true"""
            
            # Read the template file
            if os.path.exists(template_path):
                with open(template_path, 'r') as f:
                    template = f.read()
                print("Successfully read existing category request template")
            else:
                print("ERROR: Category request template not found!")
                sys.exit(1)
            
            # Replace the categories options section
            new_template = re.sub(
                r'  # BEGIN_CATEGORIES_OPTIONS.*?  # END_CATEGORIES_OPTIONS',
                f'  # BEGIN_CATEGORIES_OPTIONS\n{categories_dropdown}\n  # END_CATEGORIES_OPTIONS',
                template,
                flags=re.DOTALL
            )
            
            # Save the updated template
            with open(template_path, 'w') as f:
                f.write(new_template)
            print("Successfully updated category request template")
            
        except Exception as e:
            print(f"ERROR: Failed to update category request template: {e}")
            sys.exit(1)
    
    def update_all_templates(self):
        """
        Update all templates that depend on categories.json
        """
        print("Starting template updates...")
        self.ensure_directory_exists()
        self.update_contribution_template()
        self.update_category_request_template()
        print("Template updates completed successfully")

if __name__ == "__main__":
    print("Starting TemplateUpdater execution...")
    updater = TemplateUpdater()
    updater.update_all_templates()
    print("Script completed successfully!")
