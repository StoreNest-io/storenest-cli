# Storenest Plugin CLI

A command-line interface tool for developing, managing, and publishing plugins for the Storenest e-commerce platform.

## Installation

The CLI tool is included with the Storenest admin application. To use it:

```bash
# From the project root
node cli/storenest-plugin.js [command]
```

## Available Commands

### `init` - Create a new plugin project

Creates a new plugin project with the basic file structure and configuration.

```bash
node cli/storenest-plugin.js init my-awesome-plugin
```

This will create:
- `my-awesome-plugin/` directory
- `package.json` with dependencies
- `plugin.json` configuration file
- `src/` directory with main plugin files
- `README.md` with documentation
- `.gitignore` file

### `validate` - Validate plugin configuration

Validates your plugin's configuration and structure.

```bash
node cli/storenest-plugin.js validate
```

Checks:
- Plugin JSON schema validation
- Required files existence
- Code syntax validation
- Security configuration
- Dependencies validation

### `build` - Build plugin for production

Builds and packages your plugin for deployment.

```bash
node cli/storenest-plugin.js build
```

Creates:
- Minified JavaScript files
- Optimized assets
- Plugin package archive
- Checksums for security

### `info` - Show plugin information

Displays detailed information about your plugin.

```bash
node cli/storenest-plugin.js info
```

Shows:
- Plugin metadata
- Version information
- Dependencies
- Security settings
- File sizes

### `test` - Run plugin tests

Runs the plugin's test suite.

```bash
node cli/storenest-plugin.js test
```

### `publish` - Publish plugin to marketplace

Publishes your plugin to the Storenest plugin marketplace.

```bash
node cli/storenest-plugin.js publish
```

## Plugin Configuration

Your plugin's `plugin.json` file should follow this structure:

```json
{
  "name": "My Awesome Plugin",
  "description": "A description of what your plugin does",
  "version": "1.0.0",
  "author": "Your Name",
  "authorEmail": "your.email@example.com",
  "pluginCode": "my-awesome-plugin",
  "category": "marketing",
  "tags": ["email", "automation", "marketing"],
  "license": "MIT",
  "repositoryUrl": "https://github.com/yourusername/my-awesome-plugin",
  "minStorenestVersion": "1.0.0",
  "dependencies": {
    "required": [],
    "optional": []
  },
  "permissions": {
    "database": ["read:products", "write:orders"],
    "api": ["GET:/api/products", "POST:/api/orders"],
    "files": ["read:uploads", "write:reports"]
  },
  "settingsSchema": {
    "apiKey": {
      "type": "string",
      "label": "API Key",
      "required": true,
      "description": "Your external service API key"
    },
    "webhookUrl": {
      "type": "string",
      "label": "Webhook URL",
      "required": false,
      "description": "URL to send notifications to"
    }
  },
  "hooks": {
    "order.created": {
      "file": "src/hooks/order-created.js",
      "priority": 10
    },
    "product.updated": {
      "file": "src/hooks/product-updated.js",
      "priority": 5
    }
  },
  "securityLevel": "standard",
  "allowedTables": ["products", "orders", "customers"],
  "allowedDomains": ["api.external-service.com"],
  "rateLimit": 100,
  "maxExecutionTime": 30000,
  "memoryLimit": 50
}
```

## Plugin Structure

A typical plugin directory structure:

```
my-awesome-plugin/
├── plugin.json          # Plugin configuration
├── package.json         # Node.js dependencies
├── README.md           # Plugin documentation
├── src/
│   ├── index.js        # Main plugin entry point
│   ├── hooks/          # Event hooks
│   │   ├── order-created.js
│   │   └── product-updated.js
│   ├── api/            # API endpoints
│   │   ├── routes.js
│   │   └── controllers.js
│   ├── services/       # Business logic
│   │   └── external-api.js
│   └── utils/          # Utility functions
│       └── helpers.js
├── assets/             # Static assets
│   ├── icon.png
│   └── banner.jpg
├── tests/              # Test files
│   └── plugin.test.js
└── docs/               # Documentation
    └── api.md
```

## Security Guidelines

### Database Access
- Only request access to tables you actually need
- Use read-only permissions when possible
- Never access sensitive user data without explicit permission

### API Permissions
- Limit API endpoints to only those required
- Use specific HTTP methods (GET, POST, etc.)
- Document all API usage

### External Domains
- Only allow connections to trusted domains
- Use HTTPS for all external connections
- Implement proper error handling

### Rate Limiting
- Set reasonable rate limits to prevent abuse
- Monitor API usage in production
- Implement exponential backoff for retries

## Best Practices

### Code Quality
- Follow JavaScript/Node.js best practices
- Use TypeScript for better type safety
- Implement proper error handling
- Write comprehensive tests

### Performance
- Optimize database queries
- Use caching where appropriate
- Minimize external API calls
- Monitor memory usage

### User Experience
- Provide clear error messages
- Implement proper loading states
- Use consistent UI patterns
- Support multiple languages

### Documentation
- Write clear, comprehensive documentation
- Include usage examples
- Document all configuration options
- Provide troubleshooting guides

## Development Workflow

1. **Initialize** your plugin project
2. **Develop** your plugin features
3. **Test** thoroughly with different scenarios
4. **Validate** your plugin configuration
5. **Build** for production
6. **Publish** to the marketplace

## Troubleshooting

### Common Issues

**Validation Errors**
- Check your `plugin.json` schema
- Ensure all required fields are present
- Verify file paths are correct

**Build Failures**
- Check for syntax errors in your code
- Ensure all dependencies are installed
- Verify file permissions

**Runtime Errors**
- Check the plugin logs in the admin panel
- Verify database permissions
- Test API endpoints manually

### Getting Help

- Check the [Plugin Developer Documentation](../docs/plugin-developer-docs.html)
- Review the [API Reference](../docs/api-reference.md)
- Join the [Developer Community](https://discord.gg/cRYwEDUaDx)
- Contact support at [developer-support@storenest.hr](mailto:developer-support@storenest.hr)

## License

This CLI tool is part of the Storenest platform and is licensed under the MIT License. 