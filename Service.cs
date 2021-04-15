namespace Terrasoft.Configuration.UsrCustomNamespace
{
    using System;
    using System.ServiceModel;
    using System.ServiceModel.Web;
    using System.ServiceModel.Activation;
    using Terrasoft.Core;
    using Terrasoft.Core.Configuration;
    using Terrasoft.Core.Entities;
    using Terrasoft.Web.Common;
    // additional
    using System.Collections.Generic;
    using System.Globalization;
    using Newtonsoft.Json;
    using System.Net;
    using System.Text;
    using System.IO;

    public class CurrencyModel
    {
        public decimal inverseRate { get; set; }
        public string numericCode { get; set; }
    }

    [ServiceContract]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class UsrCustomConfigurationService : BaseService
    {
        private static void ShowInfoMessage(string messageText, Exception ex = null)
        {
            if (ex != null)
            {
                messageText += $"\n\nException message:\n{ ex.Message }\n\nException source:\n{ ex.Source }";
            }
            var sender = "UpdatingCurrencyRates";
            MsgChannelUtilities.PostMessageToAll(sender, messageText);
        }

        [OperationContract]
        [WebInvoke(Method = "GET", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped,
        ResponseFormat = WebMessageFormat.Json)]
        public Dictionary<Guid, decimal> GetUpToDateCurrencyRates()
        {
            var baseCurrencyGuid = (Guid)SysSettings.GetValue(UserConnection, "PrimaryCurrency");
            var baseCurrencyAlphabeticCode = "";
            var currencyGuidsByNumericCode = new Dictionary<string, Guid>();

            var esqCurrency = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Currency");
            var colCurrencyId = esqCurrency.AddColumn("Id");
            var colCurrencyNumericCode = esqCurrency.AddColumn("Code");
            var colCurrencyShortName = esqCurrency.AddColumn("ShortName");
            var entitiesCurrency = esqCurrency.GetEntityCollection(UserConnection);

            foreach (var entity in entitiesCurrency)
            {
                var currencyGuid = entity.GetTypedColumnValue<Guid>(colCurrencyId.Name);
                if (currencyGuid == baseCurrencyGuid)
                {
                    baseCurrencyAlphabeticCode = entity.GetTypedColumnValue<string>(colCurrencyShortName.Name);
                    if (string.IsNullOrEmpty(baseCurrencyAlphabeticCode))
                    {
                        ShowInfoMessage(
                            "API requires the alphabetic code (ShortName) of the base/primary currency.\n" +
                            "Please make sure the requirement is satisfied before trying to update currency rates.");
                        return null;
                    }
                }
                else
                {
                    var currencyNumericCode = entity.GetTypedColumnValue<string>(colCurrencyNumericCode.Name);
                    currencyGuidsByNumericCode.Add(currencyNumericCode, currencyGuid);
                }
            }

            var wrappedNewRates = new Dictionary<string, CurrencyModel>();
            var newRatesByCurrencyGuid = new Dictionary<Guid, decimal>();

            // Full request address example: http://www.floatrates.com/daily/usd.json (or USD.json)
            var requestAddress = $"http://www.floatrates.com/daily/{ baseCurrencyAlphabeticCode }.json";
            var request = (HttpWebRequest)WebRequest.Create(requestAddress);
            request.Accept = "application/json";

            using (var response = (HttpWebResponse)request.GetResponse())
            {
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    var responseJson = "";
                    var encoding = Encoding.GetEncoding(response.CharacterSet);

                    using (var responseStream = response.GetResponseStream())
                    using (var reader = new StreamReader(responseStream, encoding))
                    {
                        responseJson = reader.ReadToEnd();
                    }
                    try
                    {
                        wrappedNewRates = JsonConvert.DeserializeObject<Dictionary<string, CurrencyModel>>(responseJson);
                    }
                    catch (Exception ex)
                    {
                        ShowInfoMessage("Failed to deserialize json response.", ex);
                        return null;
                    }

                    foreach (var item in wrappedNewRates)
                    {
                        // wrapped example:  Key="eur", Value=[numericCode, inverseRate]
                        var numericCode = item.Value.numericCode;
                        try
                        {
                            var currencyGuid = currencyGuidsByNumericCode[numericCode];
                            var creatioRate = item.Value.inverseRate;
                            newRatesByCurrencyGuid.Add(currencyGuid, creatioRate);
                        }
                        catch
                        {
                            // Currency from API response isn't present in db.
                            // Continue to the next wrapped item.
                        }
                    }
                    // Add rate = 1.0 for the base currency
                    newRatesByCurrencyGuid.Add(baseCurrencyGuid, decimal.Parse("1.0", CultureInfo.InvariantCulture));
                    return newRatesByCurrencyGuid;
                }
                else
                {
                    ShowInfoMessage("API request: bad response.");
                    return null;
                }
            }
        }

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped,
        ResponseFormat = WebMessageFormat.Json)]
        public void UpdateCurrencyRates()
        {
            var newRatesByCurrencyGuid = GetUpToDateCurrencyRates();
            if (newRatesByCurrencyGuid == null)
            {
                return;
            }

            var esqCurrencyRate = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "CurrencyRate");
            esqCurrencyRate.AddAllSchemaColumns();
            var entitiesCurrencyRate = esqCurrencyRate.GetEntityCollection(UserConnection);

            foreach (var entity in entitiesCurrencyRate)
            {
                var currencyGuid = entity.GetTypedColumnValue<Guid>("CurrencyId");
                try
                {
                    var newRate = newRatesByCurrencyGuid[currencyGuid];
                    // CurrencyRateHelper is inside Terrasoft.Configuration
                    var newMantissa = CurrencyRateHelper.GetRateMantissa(newRate);
                    entity.SetColumnValue("Rate", newRate);
                    entity.SetColumnValue("RateMantissa", newMantissa);
                    entity.Save();
                }
                catch (Exception ex)
                {
                    ShowInfoMessage("Failed to update currency rate in db.", ex);
                    return;
                }
            }
            ShowInfoMessage("All currency rates have been successfully updated in db.");
        }
    }
}
