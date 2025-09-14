using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using Microsoft.SharePoint.Client;
using SP = Microsoft.SharePoint.Client;
using System.Net;
using System.Globalization;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using Newtonsoft.Json;
using Ex = Microsoft.Office.Interop.Excel;
using System.Configuration;
using System.Threading;

namespace Check_Verification
{
    public class PaymentProcessor
    {
        private readonly string _sharePointUrl;
        private readonly string _userName;
        private readonly string _password;
        private readonly string _clientId;
        private readonly string _base64Auth;
        private readonly string _nid;
        private readonly int _batchSize;
        private readonly int _processingDelayMs;
        private readonly int _errorDelayMs;
        private readonly int _requestTimeoutMs;
        private readonly bool _enableDebugLogging;
        private readonly HttpClient _httpClient;
        private readonly SemaphoreSlim _processingSemaphore;

        // Token storage
        public string ColorToken { get; set; } = "";
        public string SayadToken { get; set; } = "";
        public string SayadConfirmToken { get; set; } = "";
        public string SayadConfirmTrToken { get; set; } = "";
        public string ColorTokenHoghoghi { get; set; } = "";

        // Result storage
        public string ColorResult { get; set; } = "";
        public string SayadResultIban { get; set; } = "";
        public string SayadResultSerial { get; set; } = "";
        public string SayadResultSeries { get; set; } = "";
        public string SayadResultName { get; set; } = "";
        public string SayadResultBranchCode { get; set; } = "";

        public string SayadConfirmReason { get; set; } = "";
        public string SayadConfirmChequeStatus { get; set; } = "";
        public string SayadConfirmChequeType { get; set; } = "";
        public string SayadConfirmBlockStatus { get; set; } = "";
        public string SayadConfirmGuaranteeStatus { get; set; } = "";
        public string SayadConfirmHolders { get; set; } = "";
        public string SayadConfirmBankCode { get; set; } = "";
        public string SayadConfirmDueDate { get; set; } = "";
        public string SayadConfirmAmount { get; set; } = "";

        public string AcceptStatusMessage { get; set; } = "";
        public string AcceptStatusCode { get; set; } = "";

        public PaymentProcessor()
        {
            _sharePointUrl = ConfigurationManager.AppSettings["SharePointUrl"] ?? "https://crm.zarsim.com";
            _userName = ConfigurationManager.AppSettings["SharePointUsername"] ?? "masoomi";
            _password = ConfigurationManager.AppSettings["SharePointPassword"] ?? "123qwe@";
            _clientId = ConfigurationManager.AppSettings["ClientId"] ?? "zarsimCompany";
            _base64Auth = ConfigurationManager.AppSettings["Base64Auth"] ?? "emFyc2ltQ29tcGFueTpzeDg4NXRRaG5sMGt3b1BjMzBXNg==";
            _nid = ConfigurationManager.AppSettings["Nid"] ?? "3980403955";
            _batchSize = int.Parse(ConfigurationManager.AppSettings["BatchSize"] ?? "10");
            _processingDelayMs = int.Parse(ConfigurationManager.AppSettings["ProcessingDelayMs"] ?? "5000");
            _errorDelayMs = int.Parse(ConfigurationManager.AppSettings["ErrorDelayMs"] ?? "10000");
            _requestTimeoutMs = int.Parse(ConfigurationManager.AppSettings["RequestTimeoutMs"] ?? "300000");
            _enableDebugLogging = bool.Parse(ConfigurationManager.AppSettings["EnableDebugLogging"] ?? "true");
            
            // Initialize HttpClient with timeout
            _httpClient = new HttpClient()
            {
                Timeout = TimeSpan.FromMilliseconds(_requestTimeoutMs)
            };
            
            // Initialize semaphore for concurrent processing control
            _processingSemaphore = new SemaphoreSlim(_batchSize, _batchSize);
        }

        // Create SharePoint client context with retry logic
        private ClientContext CreateSharePointContext()
        {
            var context = new ClientContext(_sharePointUrl);
            context.AuthenticationMode = ClientAuthenticationMode.FormsAuthentication;
            context.FormsAuthenticationLoginInfo = new FormsAuthenticationLoginInfo(_userName, _password);
            context.RequestTimeout = _requestTimeoutMs;
            return context;
        }

        // Logging method
        private void LogMessage(string message, bool isError = false)
        {
            if (_enableDebugLogging || isError)
            {
                var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                var prefix = isError ? "ERROR" : "INFO";
                Console.WriteLine($"[{timestamp}] {prefix}: {message}");
            }
        }

        // Lock item for processing
        private async Task<bool> TryLockItemAsync(ClientContext context, string itemId)
        {
            try
            {
                var list = context.Web.Lists.GetByTitle("CustomerPayment");
                var listItem = list.GetItemById(itemId);
                
                context.Load(listItem, i => i["Processing"]);
                await context.ExecuteQueryAsync();
                
                if (listItem["Processing"]?.ToString() == "1")
                    return false;
                
                listItem["Processing"] = "1";
                listItem["ProcessingTime"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                listItem.Update();
                await context.ExecuteQueryAsync();
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error locking item {itemId}: {ex.Message}");
                return false;
            }
        }

        // Unlock item after processing
        private async Task UnlockItemAsync(ClientContext context, string itemId)
        {
            try
            {
                var list = context.Web.Lists.GetByTitle("CustomerPayment");
                var listItem = list.GetItemById(itemId);
                
                listItem["Processing"] = "0";
                listItem.Update();
                await context.ExecuteQueryAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error unlocking item {itemId}: {ex.Message}");
            }
        }

        // Get authentication token with timeout and retry
        private async Task<string> GetTokenAsync(string scope, int maxRetries = 3)
        {
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    using (var cts = new CancellationTokenSource(TimeSpan.FromMinutes(2)))
                    {
                        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.finnotech.ir/dev/v2/oauth2/token");
                        request.Headers.Add("Authorization", $"Basic {_base64Auth}");

                        var content = new StringContent($"{{\"grant_type\": \"client_credentials\",\"nid\": \"{_nid}\",\"scopes\": \"{scope}\"}}", 
                            Encoding.UTF8, "application/json");
                        request.Content = content;

                        var response = await _httpClient.SendAsync(request, cts.Token);
                        response.EnsureSuccessStatusCode();

                        string responseBody = await response.Content.ReadAsStringAsync();
                        var output = JsonConvert.DeserializeObject<dynamic>(responseBody);
                        return output.result.value.ToString();
                    }
                }
                catch (OperationCanceledException)
                {
                    LogMessage($"Token request timeout for scope {scope}, attempt {attempt}/{maxRetries}", true);
                    if (attempt == maxRetries) throw;
                    await Task.Delay(2000 * attempt);
                }
                catch (Exception ex)
                {
                    LogMessage($"Error getting token for scope {scope}, attempt {attempt}/{maxRetries}: {ex.Message}", true);
                    if (attempt == maxRetries) throw;
                    await Task.Delay(2000 * attempt);
                }
            }
            throw new InvalidOperationException($"Failed to get token for scope {scope} after {maxRetries} attempts");
        }

        // Initialize all tokens
        public async Task InitializeTokensAsync()
        {
            try
            {
                var tasks = new[]
                {
                    GetTokenAsync("credit:cheque-color-inquiry:get").ContinueWith(t => ColorToken = t.Result),
                    GetTokenAsync("credit:cheque-color-inquiry-legal:get").ContinueWith(t => ColorTokenHoghoghi = t.Result),
                    GetTokenAsync("credit:sayad-serial-inquiry:get").ContinueWith(t => SayadToken = t.Result),
                    GetTokenAsync("credit:cc-sayad-cheque-inquiry:get").ContinueWith(t => SayadConfirmToken = t.Result),
                    GetTokenAsync("credit:cc-sayad-accept-cheque:post").ContinueWith(t => SayadConfirmTrToken = t.Result)
                };

                await Task.WhenAll(tasks);
                Console.WriteLine("All tokens initialized successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error initializing tokens: {ex.Message}");
                throw;
            }
        }

        // Process unverified items
        public async Task ProcessUnverifiedItemsAsync()
        {
            using (var context = CreateSharePointContext())
            {
                try
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                var camlQuery = new CamlQuery();
                camlQuery.ViewXml = @"
<View>
  <Query>
    <Where>
      <And>
        <Eq>
          <FieldRef Name='Verified' />
          <Value Type='Text'>0</Value>
        </Eq>
        <Eq>
          <FieldRef Name='cash' />
          <Value Type='Text'>0</Value>
        </Eq>
        <Or>
          <IsNull>
            <FieldRef Name='Processing' />
          </IsNull>
          <Eq>
            <FieldRef Name='Processing' />
            <Value Type='Text'>0</Value>
          </Eq>
        </Or>
      </And>
    </Where>
  </Query>
  <RowLimit>10</RowLimit>
</View>";

                var items = list.GetItems(camlQuery);
                    context.Load(items);
                    await context.ExecuteQueryAsync();

                var processedIds = new HashSet<string>();
                    LogMessage($"Found {items.Count} items to process");

                foreach (var item in items)
                {
                    var itemId = item["ID"].ToString();
                    
                    if (processedIds.Contains(itemId))
                        continue;

                        if (!await TryLockItemAsync(context, itemId))
                        {
                            LogMessage($"Could not lock item {itemId}, skipping");
                        continue;
                        }

                    try
                    {
                        var nationalId = item["nationalId"]?.ToString();
                        var sayadiCode = item["sayadiCode"]?.ToString();

                        if (string.IsNullOrEmpty(sayadiCode))
                        {
                                LogMessage($"Sayad code is empty for item {itemId}");
                                await UpdateErrorAsync(itemId, "شناسه صیاد خالی است", "1");
                            continue;
                        }

                        var colorTrackId = Guid.NewGuid();
                        var sayadTrackId = Guid.NewGuid();

                            LogMessage($"Processing item {itemId} with Sayad code: {sayadiCode}");
                            
                            await GetSayadInquiryAsync(sayadTrackId, _clientId, sayadiCode, itemId);
                            await GetCheckColorHaghighiAsync(colorTrackId, _clientId, nationalId, itemId);
                            await UpdateItemAsync(itemId);

                        processedIds.Add(itemId);
                            LogMessage($"Successfully processed item {itemId}, Color: {ColorResult}");
                    }
                    catch (Exception ex)
                    {
                            LogMessage($"Error processing item {itemId}: {ex.Message}", true);
                            await UpdateErrorAsync(itemId, $"خطا در پردازش: {ex.Message}", "1");
                    }
                    finally
                    {
                            await UnlockItemAsync(context, itemId);
                        }
                }
            }
            catch (Exception ex)
            {
                    Console.WriteLine($"Error in ProcessUnverifiedItemsAsync: {ex.Message}");
                }
            }
        }

        // Update item after processing
        private async Task UpdateItemAsync(string itemId)
        {
            using (var context = CreateSharePointContext())
            {
                try
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var listItem = list.GetItemById(itemId);

                    listItem["Verified"] = "1";
                    listItem["checksColor"] = ColorResult;
                    listItem["branchCode"] = SayadResultBranchCode;
                    listItem["name"] = SayadResultName;
                    listItem["iban"] = SayadResultIban;
                    listItem["seriesNo"] = SayadResultSeries;
                    listItem["serialNo"] = SayadResultSerial;

                    listItem.Update();
                    await context.ExecuteQueryAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error updating item {itemId}: {ex.Message}");
                    throw;
                }
            }
        }

        // Update error in SharePoint
        private async Task UpdateErrorAsync(string itemId, string errorMessage, string verifiedSayadValue)
        {
            using (var context = CreateSharePointContext())
            {
                try
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var listItem = list.GetItemById(itemId);

                    listItem["Error"] = errorMessage;
                    listItem["VerifiedSayad"] = verifiedSayadValue;
                    listItem.Update();

                    await context.ExecuteQueryAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error updating error for item {itemId}: {ex.Message}");
                }
            }
        }

        // Get Sayad inquiry
        private async Task GetSayadInquiryAsync(Guid trackId, string clientId, string sayadId, string itemId)
        {
            try
            {
                if (sayadId.Length != 16 || !sayadId.All(char.IsDigit))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد باید ۱۶ رقم عددی باشد", "1");
                    return;
                }

                using (var client = new HttpClient())
                {
                    var request = new HttpRequestMessage(HttpMethod.Get, 
                        $"https://api.finnotech.ir/credit/v2/clients/{clientId}/sayadSerialInquiry?trackId={trackId}&sayadId={sayadId}");
                    request.Headers.Add("Authorization", $"Bearer {SayadToken}");

                    var response = await client.SendAsync(request);
                    response.EnsureSuccessStatusCode();

                    string responseBody = await response.Content.ReadAsStringAsync();
                    var output = JsonConvert.DeserializeObject<dynamic>(responseBody);

                    SayadResultIban = output.result.iban?.ToString() ?? "";
                    SayadResultSerial = output.result.serialNo?.ToString() ?? "";
                    SayadResultSeries = output.result.seriesNo?.ToString() ?? "";
                    SayadResultName = output.result.name?.ToString() ?? "";
                    SayadResultBranchCode = output.result.branchCode?.ToString() ?? "";

                    if (string.IsNullOrEmpty(SayadResultBranchCode))
                    {
                        await UpdateErrorAsync(itemId, "شناسه صیادی یا شناسه حقیقی/حقوقی نامعتبر است", "1");
                    }
                }
                }
                catch (Exception ex)
                {
                await UpdateErrorAsync(itemId, "شناسه صیادی یا شناسه حقیقی/حقوقی نامعتبر است", "1");
                Console.WriteLine($"Error in GetSayadInquiryAsync: {ex.Message}");
            }
        }

        // Get check color for Haghighi with timeout and error handling
        private async Task GetCheckColorHaghighiAsync(Guid trackId, string clientId, string idCode, string itemId)
        {
            try
            {
                using (var cts = new CancellationTokenSource(TimeSpan.FromMinutes(2)))
                {
                    var request = new HttpRequestMessage(HttpMethod.Get, 
                        $"https://api.finnotech.ir/credit/v2/clients/{clientId}/chequeColorInquiry?idCode={idCode}&trackId={trackId}");
                    request.Headers.Add("Authorization", $"Bearer {ColorToken}");

                    var response = await _httpClient.SendAsync(request, cts.Token);
                    response.EnsureSuccessStatusCode();

                    string responseBody = await response.Content.ReadAsStringAsync();
                    var output = JsonConvert.DeserializeObject<dynamic>(responseBody);
                    ColorResult = output.result.chequeColor?.ToString() ?? "";

                    LogMessage($"Color check result for item {itemId}: {ColorResult}");

                    if (ColorResult != "1" && ColorResult != "2" && ColorResult != "3" && ColorResult != "4" && ColorResult != "5")
                    {
                        LogMessage($"Invalid color result for item {itemId}, updating as verified");
                        await UpdateItemDirectlyAsync(itemId);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                LogMessage($"Color check timeout for item {itemId}", true);
                await UpdateItemDirectlyAsync(itemId);
            }
            catch (HttpRequestException ex)
            {
                LogMessage($"HTTP error in color check for item {itemId}: {ex.Message}", true);
                await UpdateItemDirectlyAsync(itemId);
            }
            catch (Exception ex)
            {
                LogMessage($"Error in GetCheckColorHaghighiAsync for item {itemId}: {ex.Message}", true);
                await UpdateItemDirectlyAsync(itemId);
            }
        }

        // Direct item update for error cases
        private async Task UpdateItemDirectlyAsync(string itemId)
        {
            try
            {
                using (var context = CreateSharePointContext())
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var listItem = list.GetItemById(itemId);
                    
                    listItem["Verified"] = "1";
                    listItem.Update();
                    await context.ExecuteQueryAsync();
                    
                    LogMessage($"Item {itemId} updated directly due to error");
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Error updating item {itemId} directly: {ex.Message}", true);
            }
        }

        // Main processing loop with cancellation support
        public async Task RunProcessingLoopAsync(CancellationToken cancellationToken)
        {
            LogMessage("Service started. Processing items...");

            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    // Process all types of items
                    await ProcessAllItemTypesAsync(cancellationToken);
                    
                    LogMessage($"Waiting {_processingDelayMs}ms before next cycle");
                    await Task.Delay(_processingDelayMs, cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    LogMessage("Processing cancelled by user");
                    break;
                }
                catch (Exception ex)
                {
                    LogMessage($"Error in main loop: {ex.Message}", true);
                    LogMessage($"Waiting {_errorDelayMs}ms before retry");
                    await Task.Delay(_errorDelayMs, cancellationToken);
                }
            }
        }

        // Process all types of items
        private async Task ProcessAllItemTypesAsync(CancellationToken cancellationToken)
        {
            var tasks = new List<Task>
            {
                ProcessUnverifiedItemsAsync(),
                ProcessHoghoghiItemsAsync(),
                ProcessSayadConfirmTrItemsAsync(),
                ProcessSayadRejectTrItemsAsync(),
                ProcessSayadVerifiedPendingItemsAsync()
            };

            await Task.WhenAll(tasks);
        }

        // Process Hoghoghi items
        private async Task ProcessHoghoghiItemsAsync()
        {
            using (var context = CreateSharePointContext())
            {
                try
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var camlQuery = new CamlQuery();
                    camlQuery.ViewXml = @"
<View>
  <Query>
    <Where>
      <And>
        <Eq>
          <FieldRef Name='VerifiedHoghoghi' />
          <Value Type='Text'>0</Value>
        </Eq>
        <Eq>
          <FieldRef Name='cash' />
          <Value Type='Text'>0</Value>
        </Eq>
      </And>
    </Where>
  </Query>
  <RowLimit>10</RowLimit>
</View>";

                    var items = list.GetItems(camlQuery);
                    context.Load(items);
                    await context.ExecuteQueryAsync();

                    LogMessage($"Found {items.Count} Hoghoghi items to process");

                    foreach (var item in items)
                    {
                        await ProcessHoghoghiItemAsync(item);
                    }
                }
                catch (Exception ex)
                {
                    LogMessage($"Error in ProcessHoghoghiItemsAsync: {ex.Message}", true);
                }
            }
        }

        // Process individual Hoghoghi item
        private async Task ProcessHoghoghiItemAsync(ListItem item)
        {
            var itemId = item["ID"].ToString();
            
            try
            {
                var nationalIdHoghoghi = item["nationalIdHoghoghi"]?.ToString();
                var sayadiCode = item["sayadiCode"]?.ToString();

                if (string.IsNullOrEmpty(sayadiCode))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد خالی است", "1");
                    return;
                }

                var colorTrackId = Guid.NewGuid();
                var sayadTrackId = Guid.NewGuid();

                LogMessage($"Processing Hoghoghi item {itemId} with Sayad code: {sayadiCode}");
                
                await GetSayadInquiryAsync(sayadTrackId, _clientId, sayadiCode, itemId);
                await GetCheckColorHoghoghiAsync(colorTrackId, _clientId, nationalIdHoghoghi, itemId);
                await UpdateItemAsync(itemId);

                LogMessage($"Successfully processed Hoghoghi item {itemId}, Color: {ColorResult}");
            }
            catch (Exception ex)
            {
                LogMessage($"Error processing Hoghoghi item {itemId}: {ex.Message}", true);
                await UpdateErrorAsync(itemId, $"خطا در پردازش: {ex.Message}", "1");
            }
        }

        // Get check color for Hoghoghi
        private async Task GetCheckColorHoghoghiAsync(Guid trackId, string clientId, string idCode, string itemId)
        {
            try
            {
                using (var cts = new CancellationTokenSource(TimeSpan.FromMinutes(2)))
                {
                    var request = new HttpRequestMessage(HttpMethod.Get, 
                        $"https://api.finnotech.ir/credit/v2/clients/{clientId}/chequeColorInquiryLegal?idCode={idCode}&trackId={trackId}");
                    request.Headers.Add("Authorization", $"Bearer {ColorTokenHoghoghi}");

                    var response = await _httpClient.SendAsync(request, cts.Token);
                    response.EnsureSuccessStatusCode();

                    string responseBody = await response.Content.ReadAsStringAsync();
                    var output = JsonConvert.DeserializeObject<dynamic>(responseBody);
                    ColorResult = output.result.chequeColor?.ToString() ?? "";

                    LogMessage($"Hoghoghi color check result for item {itemId}: {ColorResult}");

                    if (ColorResult != "1" && ColorResult != "2" && ColorResult != "3" && ColorResult != "4" && ColorResult != "5")
                    {
                        LogMessage($"Invalid Hoghoghi color result for item {itemId}, updating as verified");
                        await UpdateHoghoghiItemDirectlyAsync(itemId);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                LogMessage($"Hoghoghi color check timeout for item {itemId}", true);
                await UpdateHoghoghiItemDirectlyAsync(itemId);
            }
            catch (Exception ex)
            {
                LogMessage($"Error in GetCheckColorHoghoghiAsync for item {itemId}: {ex.Message}", true);
                await UpdateHoghoghiItemDirectlyAsync(itemId);
            }
        }

        // Update Hoghoghi item directly
        private async Task UpdateHoghoghiItemDirectlyAsync(string itemId)
        {
            try
            {
                using (var context = CreateSharePointContext())
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var listItem = list.GetItemById(itemId);
                    
                    listItem["VerifiedHoghoghi"] = "1";
                    listItem.Update();
                    await context.ExecuteQueryAsync();
                    
                    LogMessage($"Hoghoghi item {itemId} updated directly due to error");
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Error updating Hoghoghi item {itemId} directly: {ex.Message}", true);
            }
        }

        // Process Sayad Confirm Tr items
        private async Task ProcessSayadConfirmTrItemsAsync()
        {
            using (var context = CreateSharePointContext())
            {
                try
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var camlQuery = new CamlQuery();
                    camlQuery.ViewXml = @"
<View>
  <Query>
    <Where>
      <And>
        <Eq>
          <FieldRef Name='VerifiedConfirmSayadTr' />
          <Value Type='Text'>0</Value>
        </Eq>
        <Eq>
          <FieldRef Name='cash' />
          <Value Type='Text'>0</Value>
        </Eq>
      </And>
    </Where>
  </Query>
  <RowLimit>10</RowLimit>
</View>";

                    var items = list.GetItems(camlQuery);
                    context.Load(items);
                    await context.ExecuteQueryAsync();

                    LogMessage($"Found {items.Count} Sayad Confirm Tr items to process");

                    foreach (var item in items)
                    {
                        await ProcessSayadConfirmTrItemAsync(item);
                    }
                }
                catch (Exception ex)
                {
                    LogMessage($"Error in ProcessSayadConfirmTrItemsAsync: {ex.Message}", true);
                }
            }
        }

        // Process individual Sayad Confirm Tr item
        private async Task ProcessSayadConfirmTrItemAsync(ListItem item)
        {
            var itemId = item["ID"].ToString();
            
            try
            {
                var sayadiCode = item["sayadiCode"]?.ToString();

                if (string.IsNullOrEmpty(sayadiCode))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد خالی است", "1");
                    return;
                }

                LogMessage($"Processing Sayad Confirm Tr item {itemId} with Sayad code: {sayadiCode}");
                
                await SendSayadAcceptChequeAsync(sayadiCode, itemId);
                await UpdateItemAfterSayadConfirmTrAsync(itemId);

                LogMessage($"Successfully processed Sayad Confirm Tr item {itemId}, Status: {AcceptStatusMessage}");
            }
            catch (Exception ex)
            {
                LogMessage($"Error processing Sayad Confirm Tr item {itemId}: {ex.Message}", true);
                await UpdateErrorAsync(itemId, $"خطا در پردازش: {ex.Message}", "1");
            }
        }

        // Send Sayad Accept Cheque
        private async Task SendSayadAcceptChequeAsync(string sayadId, string itemId)
        {
            try
            {
                if (string.IsNullOrEmpty(sayadId))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد خالی است", "1");
                    return;
                }

                if (sayadId.Length != 16 || !sayadId.All(char.IsDigit))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد باید ۱۶ رقم عددی باشد", "1");
                    return;
                }

                using (var cts = new CancellationTokenSource(TimeSpan.FromMinutes(3)))
                {
                    string trackId = Guid.NewGuid().ToString();
                    string requestUrl = $"https://api.finnotech.ir/credit/v2/clients/zarsimCompany/users/0079720420/cc/sayadAcceptCheque?trackId={trackId}";
                    var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);

                    request.Headers.Add("Authorization", "Bearer " + SayadConfirmTrToken);

                    var payload = new
                    {
                        sayadId = sayadId,
                        accept = "1",
                        acceptDescription = "تایید",
                        acceptor = new
                        {
                            idCode = "10861230329",
                            shahabId = "2000010861230324",
                            idType = "2"
                        },
                        acceptorAgent = new
                        {
                            idCode = "0079720420",
                            shahabId = "1000000079720425",
                            idType = "1"
                        }
                    };

                    string jsonPayload = JsonConvert.SerializeObject(payload);
                    request.Content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

                    LogMessage($"Sending Sayad Accept request for item {itemId}");

                    var response = await _httpClient.SendAsync(request, cts.Token);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorBody = await response.Content.ReadAsStringAsync();
                        await UpdateErrorAsync(itemId, $"خطا در تایید چک صیاد: API call failed with status {(int)response.StatusCode} - {response.StatusCode}\nBody: {errorBody}", "1");
                        return;
                    }

                    var responseBody = await response.Content.ReadAsStringAsync();
                    var output = JsonConvert.DeserializeObject<dynamic>(responseBody);
                    AcceptStatusMessage = output.result?.message?.ToString() ?? "";
                    AcceptStatusCode = output.status?.ToString() ?? "";

                    LogMessage($"Sayad Accept response for item {itemId}: Status={AcceptStatusCode}, Message={AcceptStatusMessage}");
                }
            }
            catch (OperationCanceledException)
            {
                LogMessage($"Sayad Accept timeout for item {itemId}", true);
                await UpdateErrorAsync(itemId, "خطا در تایید چک صیاد: Timeout", "1");
            }
            catch (Exception ex)
            {
                LogMessage($"Error in SendSayadAcceptChequeAsync for item {itemId}: {ex.Message}", true);
                await UpdateErrorAsync(itemId, $"خطا در تایید چک صیاد: {ex.Message}", "1");
            }
        }

        // Update item after Sayad Confirm Tr
        private async Task UpdateItemAfterSayadConfirmTrAsync(string itemId)
        {
            try
            {
                using (var context = CreateSharePointContext())
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var listItem = list.GetItemById(itemId);

                    listItem["VerifiedConfirmSayadTr"] = "1";
                    listItem["sayadConfirmAcceptStatusMessage"] = AcceptStatusMessage;
                    listItem["sayadConfirmAcceptStatusCode"] = AcceptStatusCode;
                    listItem.Update();
                    await context.ExecuteQueryAsync();
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Error updating item {itemId} after Sayad Confirm Tr: {ex.Message}", true);
            }
        }

        // Process Sayad Reject Tr items
        private async Task ProcessSayadRejectTrItemsAsync()
        {
            using (var context = CreateSharePointContext())
            {
                try
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var camlQuery = new CamlQuery();
                    camlQuery.ViewXml = @"
<View>
  <Query>
    <Where>
      <And>
        <Eq>
          <FieldRef Name='VerifiedRejectSayadTr' />
          <Value Type='Text'>0</Value>
        </Eq>
        <Eq>
          <FieldRef Name='cash' />
          <Value Type='Text'>0</Value>
        </Eq>
      </And>
    </Where>
  </Query>
  <RowLimit>10</RowLimit>
</View>";

                    var items = list.GetItems(camlQuery);
                    context.Load(items);
                    await context.ExecuteQueryAsync();

                    LogMessage($"Found {items.Count} Sayad Reject Tr items to process");

                    foreach (var item in items)
                    {
                        await ProcessSayadRejectTrItemAsync(item);
                    }
                }
                catch (Exception ex)
                {
                    LogMessage($"Error in ProcessSayadRejectTrItemsAsync: {ex.Message}", true);
                }
            }
        }

        // Process individual Sayad Reject Tr item
        private async Task ProcessSayadRejectTrItemAsync(ListItem item)
        {
            var itemId = item["ID"].ToString();
            
            try
            {
                var sayadiCode = item["sayadiCode"]?.ToString();

                if (string.IsNullOrEmpty(sayadiCode))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد خالی است", "1");
                    return;
                }

                LogMessage($"Processing Sayad Reject Tr item {itemId} with Sayad code: {sayadiCode}");
                
                await SendSayadRejectChequeAsync(sayadiCode, itemId);
                await UpdateItemAfterSayadRejectTrAsync(itemId);

                LogMessage($"Successfully processed Sayad Reject Tr item {itemId}, Status: {AcceptStatusMessage}");
            }
            catch (Exception ex)
            {
                LogMessage($"Error processing Sayad Reject Tr item {itemId}: {ex.Message}", true);
                await UpdateErrorAsync(itemId, $"خطا در پردازش: {ex.Message}", "1");
            }
        }

        // Send Sayad Reject Cheque
        private async Task SendSayadRejectChequeAsync(string sayadId, string itemId)
        {
            try
            {
                if (string.IsNullOrEmpty(sayadId))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد خالی است", "1");
                    return;
                }

                if (sayadId.Length != 16 || !sayadId.All(char.IsDigit))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد باید ۱۶ رقم عددی باشد", "1");
                    return;
                }

                using (var cts = new CancellationTokenSource(TimeSpan.FromMinutes(3)))
                {
                    string trackId = Guid.NewGuid().ToString();
                    string requestUrl = $"https://api.finnotech.ir/credit/v2/clients/zarsimCompany/users/0079720420/cc/sayadAcceptCheque?trackId={trackId}";
                    var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);

                    request.Headers.Add("Authorization", "Bearer " + SayadConfirmTrToken);

                    var payload = new
                    {
                        sayadId = sayadId,
                        accept = "0",
                        acceptDescription = "رد",
                        acceptor = new
                        {
                            idCode = "10861230329",
                            shahabId = "2000010861230324",
                            idType = "2"
                        },
                        acceptorAgent = new
                        {
                            idCode = "0079720420",
                            shahabId = "1000000079720425",
                            idType = "1"
                        }
                    };

                    string jsonPayload = JsonConvert.SerializeObject(payload);
                    request.Content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

                    LogMessage($"Sending Sayad Reject request for item {itemId}");

                    var response = await _httpClient.SendAsync(request, cts.Token);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorBody = await response.Content.ReadAsStringAsync();
                        await UpdateErrorAsync(itemId, $"خطا در رد چک صیاد: API call failed with status {(int)response.StatusCode} - {response.StatusCode}\nBody: {errorBody}", "1");
                        return;
                    }

                    var responseBody = await response.Content.ReadAsStringAsync();
                    var output = JsonConvert.DeserializeObject<dynamic>(responseBody);
                    AcceptStatusMessage = output.result?.message?.ToString() ?? "";
                    AcceptStatusCode = output.status?.ToString() ?? "";

                    LogMessage($"Sayad Reject response for item {itemId}: Status={AcceptStatusCode}, Message={AcceptStatusMessage}");
                }
            }
            catch (OperationCanceledException)
            {
                LogMessage($"Sayad Reject timeout for item {itemId}", true);
                await UpdateErrorAsync(itemId, "خطا در رد چک صیاد: Timeout", "1");
            }
            catch (Exception ex)
            {
                LogMessage($"Error in SendSayadRejectChequeAsync for item {itemId}: {ex.Message}", true);
                await UpdateErrorAsync(itemId, $"خطا در رد چک صیاد: {ex.Message}", "1");
            }
        }

        // Update item after Sayad Reject Tr
        private async Task UpdateItemAfterSayadRejectTrAsync(string itemId)
        {
            try
            {
                using (var context = CreateSharePointContext())
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var listItem = list.GetItemById(itemId);

                    listItem["VerifiedRejectSayadTr"] = "1";
                    listItem["sayadConfirmAcceptStatusMessage"] = AcceptStatusMessage;
                    listItem["sayadConfirmAcceptStatusCode"] = AcceptStatusCode;
                    listItem.Update();
                    await context.ExecuteQueryAsync();
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Error updating item {itemId} after Sayad Reject Tr: {ex.Message}", true);
            }
        }

        // Process Sayad Verified Pending items
        private async Task ProcessSayadVerifiedPendingItemsAsync()
        {
            using (var context = CreateSharePointContext())
            {
                try
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var camlQuery = new CamlQuery();
                    camlQuery.ViewXml = @"
<View>
  <Query>
    <Where>
      <And>
        <Eq>
          <FieldRef Name='VerifiedSayad' />
          <Value Type='Text'>0</Value>
        </Eq>
        <Eq>
          <FieldRef Name='cash' />
          <Value Type='Text'>0</Value>
        </Eq>
      </And>
    </Where>
  </Query>
  <RowLimit>10</RowLimit>
</View>";

                    var items = list.GetItems(camlQuery);
                    context.Load(items);
                    await context.ExecuteQueryAsync();

                    LogMessage($"Found {items.Count} Sayad Verified Pending items to process");

                    foreach (var item in items)
                    {
                        await ProcessSayadVerifiedPendingItemAsync(item);
                    }
                }
                catch (Exception ex)
                {
                    LogMessage($"Error in ProcessSayadVerifiedPendingItemsAsync: {ex.Message}", true);
                }
            }
        }

        // Process individual Sayad Verified Pending item
        private async Task ProcessSayadVerifiedPendingItemAsync(ListItem item)
        {
            var itemId = item["ID"].ToString();
            
            try
            {
                var sayadiCode = item["sayadiCode"]?.ToString();

                if (string.IsNullOrEmpty(sayadiCode))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد خالی است", "1");
                    return;
                }

                LogMessage($"Processing Sayad Verified Pending item {itemId} with Sayad code: {sayadiCode}");
                
                bool isSuccess = await GetSayadConfirmInquiryAsync(sayadiCode, itemId);
                if (isSuccess)
                {
                    await UpdateItemAfterSayadConfirmWebServiceAsync(itemId);
                }

                LogMessage($"Successfully processed Sayad Verified Pending item {itemId}");
            }
            catch (Exception ex)
            {
                LogMessage($"Error processing Sayad Verified Pending item {itemId}: {ex.Message}", true);
                await UpdateErrorAsync(itemId, $"خطا در پردازش: {ex.Message}", "1");
            }
        }

        // Get Sayad Confirm Inquiry
        private async Task<bool> GetSayadConfirmInquiryAsync(string sayadId, string itemId)
        {
            try
            {
                if (sayadId.Length != 16 || !sayadId.All(char.IsDigit))
                {
                    await UpdateErrorAsync(itemId, "شناسه صیاد باید ۱۶ رقم عددی باشد", "1");
                    return false;
                }

                using (var cts = new CancellationTokenSource(TimeSpan.FromMinutes(2)))
                {
                    var request = new HttpRequestMessage(HttpMethod.Get, 
                        $"https://api.finnotech.ir/credit/v2/clients/zarsimCompany/users/3980403955/sayadChequeInquiry?sayadId={sayadId}&idCode=10861230329&idType=2");
                    request.Headers.Add("Authorization", "Bearer " + SayadConfirmToken);

                    var response = await _httpClient.SendAsync(request, cts.Token);
                    response.EnsureSuccessStatusCode();

                    string responseBody = await response.Content.ReadAsStringAsync();
                    var output = JsonConvert.DeserializeObject<dynamic>(responseBody);

                    if (output.status?.ToString() == "DONE" && output.result?.message?.ToString() == "Cheque is not in cartable")
                    {
                        await UpdateErrorAsync(itemId, "چک در کارتابل ثبت نشده است", "2");
                        return false;
                    }

                    if (output.status?.ToString() != "DONE" || output.result == null)
                    {
                        await UpdateErrorAsync(itemId, $"خطا در استعلام صیاد: {output.error?.ToString() ?? "پاسخ نامعتبر"}", "1");
                        return false;
                    }

                    SayadConfirmReason = output.result.reason?.ToString() ?? "";
                    SayadConfirmBlockStatus = output.result.blockStatus?.ToString() ?? "";
                    SayadConfirmChequeStatus = output.result.chequeStatus?.ToString() ?? "";
                    SayadConfirmBankCode = output.result.bankCode?.ToString() ?? "";
                    SayadConfirmChequeType = output.result.chequeType?.ToString() ?? "";
                    SayadConfirmGuaranteeStatus = output.result.guaranteeStatus?.ToString() ?? "";
                    SayadConfirmAmount = output.result.amount?.ToString() ?? "";
                    SayadConfirmDueDate = output.result.dueDate?.ToString() ?? "";

                    if (output.result?.holders?.Type == Newtonsoft.Json.Linq.JTokenType.Array)
                    {
                        SayadConfirmHolders = output.result.holders.ToString();
                    }
                    else
                    {
                        SayadConfirmHolders = "[]";
                    }

                    LogMessage($"Sayad Confirm inquiry successful for item {itemId}");
                    return true;
                }
            }
            catch (OperationCanceledException)
            {
                LogMessage($"Sayad Confirm inquiry timeout for item {itemId}", true);
                await UpdateErrorAsync(itemId, "خطا در استعلام صیاد: Timeout", "1");
                return false;
            }
            catch (Exception ex)
            {
                LogMessage($"Error in GetSayadConfirmInquiryAsync for item {itemId}: {ex.Message}", true);
                await UpdateErrorAsync(itemId, $"خطا در استعلام صیاد: {ex.Message}", "1");
                return false;
            }
        }

        // Update item after Sayad Confirm Web Service
        private async Task UpdateItemAfterSayadConfirmWebServiceAsync(string itemId)
        {
            try
            {
                using (var context = CreateSharePointContext())
                {
                    var list = context.Web.Lists.GetByTitle("CustomerPayment");
                    var listItem = list.GetItemById(itemId);

                    listItem["sayadConfirmBankCode"] = SayadConfirmBankCode;
                    listItem["sayadConfirmBlockStatus"] = SayadConfirmBlockStatus;
                    listItem["sayadConfirmChequeStatus"] = SayadConfirmChequeStatus;
                    listItem["sayadConfirmChequeType"] = SayadConfirmChequeType;
                    listItem["sayadConfirmGuaranteeStatus"] = SayadConfirmGuaranteeStatus;
                    listItem["sayadConfirmHolders"] = SayadConfirmHolders;
                    listItem["sayadConfirmReason"] = SayadConfirmReason;
                    listItem["sayadConfirmDueDate"] = SayadConfirmDueDate;
                    listItem["sayadConfirmAmount"] = SayadConfirmAmount;
                    listItem["VerifiedSayad"] = "1";

                    listItem.Update();
                    await context.ExecuteQueryAsync();
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Error updating item {itemId} after Sayad Confirm Web Service: {ex.Message}", true);
            }
        }

        // Dispose method
        public void Dispose()
        {
            _httpClient?.Dispose();
            _processingSemaphore?.Dispose();
        }
    }

    class Program
    {
        private static PaymentProcessor _processor;
        private static CancellationTokenSource _cancellationTokenSource;

        static async Task Main(string[] args)
        {
            // Configure SSL/TLS
            ServicePointManager.Expect100Continue = true;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            
            // Setup cancellation token
            _cancellationTokenSource = new CancellationTokenSource();
            
            // Setup console cancel event
            Console.CancelKeyPress += (sender, e) =>
            {
                e.Cancel = true;
                Console.WriteLine("\nShutting down gracefully...");
                _cancellationTokenSource.Cancel();
            };

            _processor = new PaymentProcessor();
            
            try
            {
                Console.WriteLine("Starting Payment Verification Service...");
                Console.WriteLine("Press Ctrl+C to stop the service");
                
                // Initialize tokens
                await _processor.InitializeTokensAsync();
                
                // Start main processing loop
                await _processor.RunProcessingLoopAsync(_cancellationTokenSource.Token);
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine("Service stopped by user");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Fatal error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
            finally
            {
                _processor?.Dispose();
                _cancellationTokenSource?.Dispose();
                Console.WriteLine("Service stopped. Press any key to exit...");
                Console.ReadKey();
            }
        }
    }
}