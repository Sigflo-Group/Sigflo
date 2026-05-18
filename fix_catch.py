import re
import sys

def fix_empty_catch(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # Replace `catch {` with `catch (e) { console.error('[Error caught in ' + filename + ']', e);`
        # Also `catch { /* ignore */ }`
        
        # Regex to find catch blocks with or without variable, and with just comments inside
        
        # It's better to just do exact replacements for the ones we know about.
        content = re.sub(r'catch\s*\{\s*/\*\s*ignore\s*\*/\s*\}', r'catch (e) { console.error("[Caught Error]", e); }', content)
        content = re.sub(r'catch\s*\(\)\s*\{\s*\}', r'catch (e) { console.error("[Caught Error]", e); }', content)

        with open(filepath, 'w') as f:
            f.write(content)
            
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for f in sys.argv[1:]:
    fix_empty_catch(f)
