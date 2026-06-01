import re
import sys
import os

def fix_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # catch { -> catch (e) { console.error('[Caught Error]', e);
        # Wait, if there are multiple lines inside catch {, we shouldn't just replace `catch {`.
        # The prompt says: "800+ empty catch blocks silently swallow errors."
        # Meaning: catch blocks that are literally empty or only contain comments.
        
        # Match `catch { \n /* ignore */ \n }` or `catch { }`
        # Using a regex that matches `catch\s*\{[\s\n/\\*a-zA-Z-]*\}`
        
        pattern = r'catch\s*\{(?:\s*/\*.*?\*/\s*)?\}'
        content = re.sub(pattern, r'catch (e) { console.error("[Caught Error]", e); }', content, flags=re.DOTALL)
        
        # Match `.catch(() => {})`
        content = content.replace('.catch(() => {})', '.catch((e) => { console.error("[Caught Promise Error]", e); })')
        
        # There's also `catch (error) { \n /* ignore */ \n }`
        pattern2 = r'catch\s*\([a-zA-Z_]+\)\s*\{(?:\s*/\*.*?\*/\s*)?\}'
        content = re.sub(pattern2, r'catch (e) { console.error("[Caught Error]", e); }', content, flags=re.DOTALL)
        
        # `catch { \n    \n  }`
        pattern3 = r'catch\s*\{\s*\}'
        content = re.sub(pattern3, r'catch (e) { console.error("[Caught Error]", e); }', content, flags=re.DOTALL)

        with open(filepath, 'w') as f:
            f.write(content)
    except Exception as e:
        pass

for root, dirs, files in os.walk('/app/src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

fix_file('/app/vite.config.ts')
