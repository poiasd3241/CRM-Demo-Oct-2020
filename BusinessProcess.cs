#region БП_НоваяТранзакция (Task #5)

// Sending email
using (var client = new SmtpClient("smtp.gmail.com"))
using (var mail = new MailMessage())
{
    var senderEmail = "secret@email.com";
    var senderEmailPassword = "secret";

    var emailSender = new MailAddress(senderEmail);
    mail.From = emailSender;
    mail.To.Add(new MailAddress(Get<string>("ProcessSchemaParameterContactEmail")));
    mail.Subject = Get<string>("ProcessSchemaParameterEmailSubject");
    mail.Body = Get<string>("ProcessSchemaParameterEmailBody");
    client.Port = 587;
    client.Credentials = new NetworkCredential(emailSender.Address, senderEmailPassword);
    client.EnableSsl = true;
    client.Send(mail);
}
return true;

// EMAIL BODY formula:
// "Новое сообщение по транзакции \"" + [#Чтение: Транзикции [новая запись].Первый элемент результирующей коллекции.Название#] + 
// "\":\n\nНомер: " + [#Чтение: Транзикции [новая запись].Первый элемент результирующей коллекции.Номер#] + 
// "\nСообщение: " + [#Чтение: Транзикции [новая запись].Первый элемент результирующей коллекции.Комментарий#] + 
// "\nДата (транзакции): " + [#Чтение: Транзикции [новая запись].Первый элемент результирующей коллекции.Дата#] + " UTC"

// CONTACT IS FROM OUR COMPANY formula:
// [#Чтение: Контакт.Первый элемент результирующей коллекции.Контрагент#].ToString().ToUpper() == "E308B781-3C5B-4ECB-89EF-5C1ED4DA488E"

#endregion



#region БП_НоваяТранзакция_EmailCheck (Task #7)

// [EntitySchemaQuery] Чтение: Контакт
var esqResult = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Contact");
var colAccount = esqResult.AddColumn("Account.Id");
var colEmail = esqResult.AddColumn("Email");
var entity = esqResult.GetEntity(UserConnection, Get<Guid>("ProcessSchemaParameterNewTransactionContactId"));

var account = entity.GetTypedColumnValue<Guid>(colAccount.Name);
var emailAddress = entity.GetTypedColumnValue<string>(colEmail.Name);

var isContactFromOurCompany = account == Get<Guid>("ProcessSchemaParameterOurCompanyAccountId");
Set("ProcessSchemaParameterIsContactFromOurCompany", isContactFromOurCompany);
if (isContactFromOurCompany == false)
{
    var isContactEmailFilled = string.IsNullOrEmpty(emailAddress) == false;
    Set("ProcessSchemaParameterIsContactEmailFilled", isContactEmailFilled);
    if (isContactEmailFilled)
    {
        Set("ProcessSchemaParameterContactEmail", emailAddress);
    }
}
return true;

// [CreateEntity] Добавление записи в Сообщения по транзакции
var schema = UserConnection.EntitySchemaManager.GetInstanceByName("UsrTransactionMsgsDetail");
var entity = schema.CreateEntity(UserConnection);
entity.SetDefColumnValues();
entity.SetColumnValue("UsrTransactionId", Get<Guid>("ProcessSchemaParameterNewTransactionId"));
entity.SetColumnValue("UsrTypeId", Get<Guid>("ProcessSchemaParameterTransactionMsgTypeEmailId"));
entity.SetColumnValue("UsrNumber", Get<string>("ProcessSchemaParameterNewTransactionNumber"));
entity.SetColumnValue("UsrMsg", Get<string>("ProcessSchemaParameterNewTransactionComment"));
entity.SetColumnValue("UsrDate", DateTime.UtcNow);
entity.Save();
return true;

// EMAIL BODY formula
// "Новое сообщение по транзакции \"" + [#Чтение: Транзикции [новая запись].Первый элемент результирующей коллекции.Название#] + 
// "\":\n\nНомер: " + [#Номер новой транзакции#] + 
// "\nСообщение: " + [#Комментарий из новой транзакции#] + 
// "\nДата (транзакции): " + [#Чтение: Транзикции [новая запись].Первый элемент результирующей коллекции.Дата#] + " UTC"


// Sending email (SAME AS TASK #5)
using (var client = new SmtpClient("smtp.gmail.com"))
using (var mail = new MailMessage())
{
    var senderEmail = "secret@email.com";
    var senderEmailPassword = "secret";

    var emailSender = new MailAddress(senderEmail);
    mail.From = emailSender;
    mail.To.Add(new MailAddress(Get<string>("ProcessSchemaParameterContactEmail")));
    mail.Subject = Get<string>("ProcessSchemaParameterEmailSubject");
    mail.Body = Get<string>("ProcessSchemaParameterEmailBody");
    client.Port = 587;
    client.Credentials = new NetworkCredential(emailSender.Address, senderEmailPassword);
    client.EnableSsl = true;
    client.Send(mail);
}
return true;

#endregion



#region CloseAllOpenTransactions

// METHODS with Using: Terrasoft.Configuration & System
private static void ShowInfoMessage(string messageText, Exception ex = null)
{
    if (ex != null)
    {
        messageText += $"\n\nException message:\n{ ex.Message }\n\nnException source:\n{ ex.Source }";
    }
    var sender = "ClosingAllOpenTransactions";
    MsgChannelUtilities.PostMessageToAll(sender, messageText);
}

// SCRIPT TASK
var openTransactionTypeGuid = Get<Guid>("ProcessSchemaParameterOpenTransactionId");
var closedTransactionTypeGuid = Get<Guid>("ProcessSchemaParameterClosedTransactionId");

var esqOpenTransactions = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "UsrTransactions");
esqOpenTransactions.AddAllSchemaColumns();
esqOpenTransactions.Filters.Add(esqOpenTransactions.CreateFilterWithParameters(FilterComparisonType.Equal, "UsrType.Id", openTransactionTypeGuid));
var entitiesOpenTransactions = esqOpenTransactions.GetEntityCollection(UserConnection);

if (entitiesOpenTransactions.Count == 0)
{
    ShowInfoMessage("There are no open transactions at the moment");
    return true;
}

foreach (var entity in entitiesOpenTransactions)
{
    try
    {
        entity.SetColumnValue("UsrTypeId", closedTransactionTypeGuid);
        entity.SetColumnValue("UsrCloseDate", DateTime.Today);
        entity.Save();
    }
    catch (Exception ex)
    {
        ShowInfoMessage("Failed to close open transactions.", ex);
        return true;
    }
}
ShowInfoMessage("All open transactions have been successfully closed.");
return true;

#endregion
