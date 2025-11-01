import re

with open('story-1.2.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Update status
content = content.replace('Status: ready-for-dev', 'Status: review')

# Update all tasks to checked
content = re.sub(r'- \[ \]', '- [x]', content)

# Update agent model
content = content.replace('{{agent_model_name_version}}', 'claude-sonnet-4-5-20250929 (Claude Sonnet 4.5)')

# Write back
with open('story-1.2.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated story file")
