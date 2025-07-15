# Sample Plugin Template

This is a comprehensive template for creating external plugins for the Storenest platform. Use this template as a starting point for your own plugins.

## Features

This template includes:

- ✅ Complete plugin structure with manifest
- ✅ Settings management system
- ✅ Hook system for event handling
- ✅ API integration utilities
- ✅ Error handling and logging
- ✅ Background task management
- ✅ Database operations
- ✅ Notification system
- ✅ Security best practices
- ✅ Comprehensive documentation

## Quick Start

1. **Copy the template** to your plugin directory
2. **Modify the manifest** in `plugin.js` with your plugin details
3. **Customize the settings** schema for your needs
4. **Implement your hooks** to handle events
5. **Test your plugin** locally
6. **Package and upload** to the Storenest marketplace

## Plugin Structure

```
my-awesome-plugin/
├── plugin.js          # Main plugin file (this template)
├── README.md          # This file
├── CHANGELOG.md       # Version history
├── assets/            # Images, icons, etc.
│   ├── icon.png       # Plugin icon (64x64px)
│   └── banner.png     # Plugin banner (800x200px)
└── package.json       # Dependencies (if any)
```

## Configuration

### Manifest

Update the manifest in `plugin.js` with your plugin details:

```javascript
/*
@manifest {
  "name": "Your Plugin Name",
  "description": "Your plugin description",
  "version": "1.0.0",
  "author": "Your Name",
  "pluginCode": "your-plugin-code",
  "category": "Your Category",
  "permissions": ["database.read", "api.read"],
  "hooks": ["afterOrderCreate", "onPluginInstall"]
}
*/
```

### Settings

Modify the settings schema to match your plugin's configuration needs:

```javascript
const settings = {
  api_key: {
    type: 'string',
    label: 'API Key',
    description: 'Your external service API key',
    required: true,
    sensitive: true
  },
  // Add more settings as needed
};
```

## Hooks

The template includes several hook examples:

- `afterOrderCreate` - Handle new orders
- `beforeProductUpdate` - Validate product updates
- `afterProductUpdate` - Process product changes
- `onPluginInstall` - Initialize plugin
- `onPluginUninstall` - Clean up plugin

## API Integration

The template includes utilities for:

- Making API requests with retry logic
- Handling authentication
- Error handling and logging
- Rate limiting protection

## Security

The template follows security best practices:

- Input validation and sanitization
- Secure storage of sensitive data
- Error handling without exposing sensitive information
- Permission-based access control

## Testing

Test your plugin before publishing:

1. **Validate manifest** - Ensure all required fields are present
2. **Test hooks** - Verify your hook handlers work correctly
3. **Test settings** - Ensure settings are saved and retrieved properly
4. **Test API calls** - Verify external integrations work
5. **Test error handling** - Ensure errors are handled gracefully

## Publishing

When ready to publish:

1. **Complete your plugin** with all features
2. **Write documentation** (README, CHANGELOG)
3. **Create assets** (icon, banner)
4. **Test thoroughly** in different scenarios
5. **Package as ZIP** file
6. **Upload to marketplace** for review

## Support

- **Documentation**: [External Plugin Development Guide](../docs/external-plugin-development.md)
- **Examples**: Check the marketplace for plugin examples
- **Community**: Join the Storenest developer community
- **Support**: Contact developer-support@storenest.hr

## License

This template is provided under the MIT License. You can use it to create your own plugins under any license you choose.

---

Happy coding! We can't wait to see what amazing plugins you create! 🚀 