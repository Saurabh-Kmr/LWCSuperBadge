public with sharing class contactController {
    public contactController() {

    }

    @AuraEnabled(cacheable= true)
    public static List<Contact> getContacts(){
        try {
            // return [SELECT FirstName, LastName,Email
            //         FROM Contact
            //         WITH SECURITY_ENFORCED
            //         Order by FirstName , LastName];
            throw new AuraHandledException('Forced error');

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}