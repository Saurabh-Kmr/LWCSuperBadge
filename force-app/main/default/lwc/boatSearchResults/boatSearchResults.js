import { LightningElement, wire,track,api } from "lwc";
import getBoats from "@salesforce/apex/BoatDataService.getBoats";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { MessageContext,publish,subscribe,unsubscribe } from "lightning/messageService";
import { getRecordNotifyChange } from "lightning/uiRecordApi";
import updateBoatList from "@salesforce/apex/BoatDataService.updateBoatList";
import {refreshApex} from '@salesforce/apex';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT     = 'Ship it!';
const SUCCESS_VARIANT     = 'success';
const ERROR_TITLE   = 'Error';
const ERROR_VARIANT = 'error';
export default class BoatSearchResults extends LightningElement {
  @track selectedBoatId;
  columns = [{ label: 'Name', fieldName: 'Name', editable: true, type: 'text' },
  { label: 'Length', fieldName: 'Length__c', editable: true, type: 'number' },
  { label: 'Price', fieldName: 'Price__c', editable: true, type: 'currency', typeAttributes: { currencyCode: 'USD' } },
  { label: 'Description', fieldName: 'Description__c', editable: true, type: 'text' }];
  @track boatTypeId = '';
  boats;
  isLoading = false;
  
  // wired message context
  @wire(MessageContext)
  messageContext;
  // wired getBoats method 
  @wire(getBoats,{boatTypeId:'$boatTypeId'})
  wiredBoats({data,error}) {
      if(data){
      this.boats = results;
      this.notifyLoading(false);
      }
      else if(error){
        console.log('data error');
        console.log(error);
      }
   }
  
  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api
  searchBoats(boatTypeId) {
     this.boatTypeId = boatTypeId;
     this.notifyLoading(true);
   }
  
  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api
  async refresh() {
    this.notifyLoading(true);
    await refreshApex(this.boats);
    this.notifyLoading(false);
  }

  
  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile() {
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
   }
  
  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) { 
    // explicitly pass boatId to the parameter recordId
    publish(this.messageContext, BOATMC, { recordId: boatId });
  }
  
  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the 
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  async handleSave(event) {
    const updatedFields  = event.detail.draftValues;
   
    await updateBoatList({data: updatedFields })
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: MESSAGE_SHIP_IT,
                    variant: SUCCESS_VARIANT
                })
            );
            getRecordNotifyChange([{boatTypeId: this.boatTypeId}]);
            // Display fresh data in the form
            this.draftValues = [];
            this.refresh();
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error.body.message,
                    variant: ERROR_VARIANT
                })
            );
        })
        .finally(() => { 
            this.draftValues = [];
        }
        );
} 

  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) { 
    if (this.isLoading === isLoading) return
    this.isLoading = isLoading;
    if (isLoading) {
      this.dispatchEvent(new CustomEvent('loading'));
    } else {
      this.dispatchEvent(new CustomEvent('doneloading'));
    }
  }
}