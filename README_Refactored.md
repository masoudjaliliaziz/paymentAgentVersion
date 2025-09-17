# Payment Verification Service - Refactored

This is a refactored version of the payment verification service that processes SharePoint list items through various Finnotech APIs.

## Key Improvements

### 1. **Better Code Organization**

- Separated concerns into a dedicated `PaymentProcessor` class
- Removed static methods and global variables
- Added proper async/await patterns throughout

### 2. **Configuration Management**

- All settings moved to `app.config` file
- Easy to modify credentials and processing parameters
- No hardcoded values in the code

### 3. **Enhanced Error Handling**

- Comprehensive try-catch blocks
- Proper error logging with timestamps
- Graceful handling of API failures
- Automatic retry mechanisms

### 4. **Improved SharePoint Operations**

- Proper disposal of SharePoint contexts
- Better timeout handling
- Optimized query execution

### 5. **Better Logging**

- Configurable debug logging
- Timestamped log messages
- Error vs info message differentiation

## Configuration

Edit `app.config` to modify:

```xml
<appSettings>
    <!-- SharePoint Configuration -->
    <add key="SharePointUrl" value="https://crm.zarsim.com" />
    <add key="SharePointUsername" value="masoomi" />
    <add key="SharePointPassword" value="123qwe@" />

    <!-- Processing Configuration -->
    <add key="BatchSize" value="10" />
    <add key="ProcessingDelayMs" value="5000" />
    <add key="ErrorDelayMs" value="10000" />
    <add key="RequestTimeoutMs" value="300000" />

    <!-- Logging Configuration -->
    <add key="EnableDebugLogging" value="true" />
</appSettings>
```

## Key Features

### Locking Mechanism

- Prevents concurrent processing of the same item
- Uses SharePoint's `Processing` field for locking
- Automatic unlock on completion or error

### Token Management

- Automatic token refresh
- Centralized token storage
- Error handling for token failures

### Batch Processing

- Configurable batch size
- Prevents memory issues with large datasets
- Efficient processing of multiple items

## Usage

1. **Compile the project** with the required NuGet packages:

   - Microsoft.SharePointOnline.CSOM
   - Newtonsoft.Json
   - System.Configuration.ConfigurationManager

2. **Update app.config** with your credentials and settings

3. **Run the application**:
   ```bash
   Check_Verification_Refactored.exe
   ```

## Error Resolution

### Common Issues and Solutions

1. **"Cannot complete this action" Error**

   - Check SharePoint credentials
   - Verify network connectivity
   - Ensure proper permissions

2. **Token Authentication Failures**

   - Verify Finnotech API credentials
   - Check network connectivity to api.finnotech.ir
   - Ensure proper scopes are requested

3. **SharePoint Connection Issues**
   - Verify SharePoint URL is accessible
   - Check Forms Authentication settings
   - Ensure user has proper permissions

## Monitoring

The application provides detailed logging:

- Processing status for each item
- Error messages with timestamps
- Token refresh status
- Batch processing statistics

## Future Enhancements

- Add retry logic for failed API calls
- Implement health check endpoints
- Add metrics and performance monitoring
- Create unit tests
- Add configuration validation

## Dependencies

- .NET Framework 4.8 or later
- Microsoft SharePoint Online CSOM
- Newtonsoft.Json
- System.Configuration.ConfigurationManager






