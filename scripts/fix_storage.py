import os
import re

def fix_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        if 'window.localStorage' not in content and 'localStorage' not in content:
            return

        # Replace window.localStorage with secureStorage
        orig_content = content
        
        # We need to import secureStorage if it's used
        if 'window.localStorage.getItem' in content or 'window.localStorage.setItem' in content or 'window.localStorage.removeItem' in content:
            content = content.replace('window.localStorage.getItem', 'secureStorage.getItem')
            content = content.replace('window.localStorage.setItem', 'secureStorage.setItem')
            content = content.replace('window.localStorage.removeItem', 'secureStorage.removeItem')
            
            # Remove direct property access if any like !window.localStorage
            content = content.replace('!window.localStorage', 'false')
            content = content.replace('window.localStorage', 'secureStorage')
            content = content.replace('typeof window !== \'undefined\' && secureStorage', 'typeof window !== \'undefined\'')

            if orig_content != content:
                # add import
                import_stmt = "import { secureStorage } from '@/lib/storage';\n"
                if import_stmt not in content:
                    content = import_stmt + content

        with open(filepath, 'w') as f:
            f.write(content)
            
    except Exception as e:
        print(e)

for root, dirs, files in os.walk('/app/src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx') and file != 'storage.ts':
            fix_file(os.path.join(root, file))
