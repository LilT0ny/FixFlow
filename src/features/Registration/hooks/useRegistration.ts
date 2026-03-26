import { useState, useCallback } from 'react';
import { OrderService } from '../../../services/OrderService';
import { useOrders } from '../../../hooks/useOrders';
import type { DeviceCheckInForm, ServiceOrder, CustomerData } from '../../../types';
import { sendWhatsappNotification } from '../utils/whatsappNotifier';
import { useSettings } from '../../../store/SettingsContext';

/**
 * Custom hook that handles the state and network logic for repair registration.
 * Prevents visual components from handling complex data and requests.
 * 
 * @returns {Object} State variables and mutation functions for the view.
 */
export const useRegistration = () => {
  const { addOrder } = useOrders();
  const { settings } = useSettings();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [existingCustomer, setExistingCustomer] = useState<CustomerData | null>(null);

  /**
   * Checks if a customer exists by document ID (cédula)
   */
  const checkCustomer = useCallback(async (documentId: string) => {
    if (!documentId || documentId.length < 5) return;
    try {
      const result = await OrderService.checkClientByCedula(documentId);
      if (result.found && result.client) {
        setExistingCustomer(result.client);
      } else {
        setExistingCustomer(null);
      }
    } catch (error) {
      console.error('Error checking customer:', error);
    }
  }, []);

  /**
   * Processes the form, sends it to the backend and notifies the customer if successful.
   * 
   * @param {DeviceCheckInForm} registrationData - All customer, device and repair information.
   */
  const processRegistration = useCallback(async (registrationData: DeviceCheckInForm) => {
    setIsSubmitting(true);
    setRequestError(null);

    try {
      const { customer: customerInfo, device: deviceInfo } = registrationData;
       
      const newOrder = await addOrder(registrationData);
      setCreatedOrder(newOrder);

      if (customerInfo?.phone) {
        sendWhatsappNotification({
          phone: customerInfo.phone,
          customerName: customerInfo.fullName,
          deviceBrand: deviceInfo?.brand,
          deviceModel: deviceInfo?.model,
          orderNumber: newOrder.orderNumber,
          total: Number(newOrder.repair.repairTotalCost),
          abono: Number(newOrder.repair.initialDeposit),
          statusLabel: 'RECIBIDO',
          template: settings.whatsappTemplate
        });
      }
    } catch (error) {
      console.error('Error during repair registration:', error);
      setRequestError('An error occurred while saving to the database. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [addOrder, settings.whatsappTemplate]);

  return {
    currentStep,
    setCurrentStep,
    processRegistration,
    isSubmitting,
    createdOrder,
    requestError,
    existingCustomer,
    checkCustomer,
    resetRegistration: useCallback(() => {
      setCurrentStep(1);
      setCreatedOrder(null);
      setExistingCustomer(null);
    }, [])
  };
};


