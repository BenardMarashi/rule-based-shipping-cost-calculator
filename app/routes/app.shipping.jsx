// app/routes/app.shipping.jsx - Updated with force refresh for data updates
import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  Banner,
  FormLayout,
  TextField,
  DataTable,
  Modal,
  InlineStack,
  EmptyState,
  CalloutCard,
  Badge,
  SkeletonBodyText,
  Select,
  Tabs
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useSubmit, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { 
  getCarriers, 
  createCarrier, 
  updateCarrier, 
  deleteCarrier,
  addCountryRate,
  updateCountryRate,
  deleteCountryRate,
  addWeightRate,
  updateWeightRate,
  deleteWeightRate
} from "../models/carrier.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  // Load the carriers from the database
  const carriers = await getCarriers();
  
  return json({ carriers });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  
  try {
    if (action === "registerService") {
      // Register a shipping carrier service with Shopify
      const service = new admin.rest.CarrierService({
        session: admin.session,
      });
      
      service.name = "Shipping Cost Calculator";
      service.callback_url = `${process.env.SHOPIFY_APP_URL}/api/shipping-rates`;
      service.service_discovery = true;
      
      await service.save({
        update: true,
      });
      
      return json({ 
        success: true, 
        message: "Shipping service successfully registered with Shopify!" 
      });
    } 
    else if (action === "createCarrier") {
      // Create a new carrier
      const name = formData.get("name");
      const maxWeight = parseFloat(formData.get("maxWeight"));
      
      // For the new model, we only need the name and maxWeight
      await createCarrier({ 
        name, 
        maxWeight, 
        baseCost: 0,
        costPerKg: 0
      });
      
      return json({
        success: true,
        message: `Carrier "${name}" created successfully!`
      });
    }
    else if (action === "updateCarrier") {
      // Update an existing carrier
      const id = formData.get("id");
      const name = formData.get("name");
      const maxWeight = parseFloat(formData.get("maxWeight"));
      
      await updateCarrier(id, { 
        name, 
        maxWeight,
        baseCost: 0,
        costPerKg: 0
      });
      
      return json({
        success: true,
        message: `Carrier "${name}" updated successfully!`
      });
    }
    else if (action === "deleteCarrier") {
      // Delete a carrier
      const id = formData.get("id");
      await deleteCarrier(id);
      
      return json({
        success: true,
        message: "Carrier deleted successfully!"
      });
    }
    else if (action === "addCountryRate") {
      // Add a country rate to a carrier
      const carrierId = formData.get("carrierId");
      const countryCode = formData.get("countryCode");
      const countryName = formData.get("countryName");
      const deliveryTime = formData.get("deliveryTime");
      
      await addCountryRate(carrierId, { countryCode, countryName, deliveryTime });
      
      return json({
        success: true,
        message: `Country "${countryName}" added successfully!`
      });
    }
    else if (action === "updateCountryRate") {
      // Update a country rate
      const id = formData.get("id");
      const countryCode = formData.get("countryCode");
      const countryName = formData.get("countryName");
      const deliveryTime = formData.get("deliveryTime");
      
      await updateCountryRate(id, { countryCode, countryName, deliveryTime });
      
      return json({
        success: true,
        message: `Country "${countryName}" updated successfully!`
      });
    }
    else if (action === "deleteCountryRate") {
      // Delete a country rate
      const id = formData.get("id");
      await deleteCountryRate(id);
      
      return json({
        success: true,
        message: "Country rate deleted successfully!"
      });
    }
    else if (action === "addWeightRate") {
      // Add a weight rate to a country
      const countryRateId = formData.get("countryRateId");
      const minWeight = parseFloat(formData.get("minWeight"));
      const maxWeight = parseFloat(formData.get("maxWeight"));
      
      // Convert price from Euro format (with comma) to cents
      const priceStr = formData.get("price").replace(",", ".");
      const price = Math.round(parseFloat(priceStr) * 100);
      
      await addWeightRate(countryRateId, { minWeight, maxWeight, price });
      
      return json({
        success: true,
        message: `Weight segment ${minWeight}-${maxWeight}kg added successfully!`
      });
    }
    else if (action === "updateWeightRate") {
      // Update a weight rate
      const id = formData.get("id");
      const minWeight = parseFloat(formData.get("minWeight"));
      const maxWeight = parseFloat(formData.get("maxWeight"));
      
      // Convert price from Euro format (with comma) to cents
      const priceStr = formData.get("price").replace(",", ".");
      const price = Math.round(parseFloat(priceStr) * 100);
      
      await updateWeightRate(id, { minWeight, maxWeight, price });
      
      return json({
        success: true,
        message: `Weight segment updated successfully!`
      });
    }
    else if (action === "deleteWeightRate") {
      // Delete a weight rate
      const id = formData.get("id");
      await deleteWeightRate(id);
      
      return json({
        success: true,
        message: "Weight segment deleted successfully!"
      });
    }
  } catch (error) {
    console.error("Error performing action:", error);
    return json({ 
      success: false, 
      message: `Error: ${error.message}` 
    });
  }
};

// Countries data for dropdown
const COUNTRIES = [
  {label: "Austria", value: "AT"},
  {label: "Germany", value: "DE"},
  {label: "Belgium", value: "BE"},
  {label: "Bulgaria", value: "BG"},
  {label: "Czech Republic", value: "CZ"},
  {label: "Denmark", value: "DK"},
  {label: "Estonia", value: "EE"},
  {label: "Spain", value: "ES"},
  {label: "Finland", value: "FI"},
  {label: "France", value: "FR"},
  {label: "United Kingdom", value: "GB"},
  {label: "Greece", value: "GR"},
  {label: "Croatia", value: "HR"},
  {label: "Hungary", value: "HU"},
  {label: "Ireland", value: "IE"},
  {label: "Italy", value: "IT"},
  {label: "Lithuania", value: "LT"},
  {label: "Luxembourg", value: "LU"},
  {label: "Latvia", value: "LV"},
  {label: "Netherlands", value: "NL"},
  {label: "Poland", value: "PL"},
  {label: "Portugal", value: "PT"},
  {label: "Romania", value: "RO"},
  {label: "Sweden", value: "SE"},
  {label: "Slovenia", value: "SI"},
  {label: "Slovakia", value: "SK"},
];

// Common weight ranges for shipping
const COMMON_WEIGHT_RANGES = [
  { min: 0, max: 3, label: "0 - 3 kg" },
  { min: 3, max: 5, label: "3 - 5 kg" },
  { min: 5, max: 10, label: "5 - 10 kg" },
  { min: 10, max: 15, label: "10 - 15 kg" },
  { min: 15, max: 20, label: "15 - 20 kg" },
  { min: 20, max: 25, label: "20 - 25 kg" },
  { min: 25, max: 31.5, label: "25 - 31.5 kg" },
];

// Helper to format euro price with comma as decimal separator
const formatEuroPrice = (cents) => {
  return (cents / 100).toFixed(2).replace(".", ",");
};

export default function ShippingCalculator() {
  const { carriers } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  
  // Modal State Management - Only one modal can be open at a time
  const [activeModal, setActiveModal] = useState(null);
  
  // Carrier variables
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [carrierForDetails, setCarrierForDetails] = useState(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  
  // Country variables
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCountryCarrier, setSelectedCountryCarrier] = useState(null);
  
  // Weight Rate variables
  const [selectedWeightRate, setSelectedWeightRate] = useState(null);
  const [selectedCountryForRate, setSelectedCountryForRate] = useState(null);
  const [weightRateTemplate, setWeightRateTemplate] = useState("custom");
  
  // Banner State
  const [bannerVisible, setBannerVisible] = useState(false);
  
  // Carrier Form State
  const [name, setName] = useState("");
  const [maxWeight, setMaxWeight] = useState("31.5");
  
  // Country Form State
  const [countryCode, setCountryCode] = useState("AT");
  const [deliveryTime, setDeliveryTime] = useState("1-3");
  
  // Weight Rate Form State
  const [minWeight, setMinWeight] = useState("0");
  const [weightMaxWeight, setWeightMaxWeight] = useState("3");
  const [price, setPrice] = useState("0,00");
  
  // Force refresh function to ensure data is always fresh
  const forceRefresh = () => {
    window.location.reload();
  };
  
  // Reset forms when modals change
  useEffect(() => {
    if (activeModal === "carrier" && selectedCarrier) {
      setName(selectedCarrier.name);
      setMaxWeight(selectedCarrier.maxWeight.toString());
    } else if (activeModal === "carrier") {
      // Default values for new carrier
      setName("");
      setMaxWeight("31.5");
    }
    
    if (activeModal === "country") {
      if (selectedCountry) {
        setCountryCode(selectedCountry.countryCode);
        setDeliveryTime(selectedCountry.deliveryTime || "1-3");
      } else {
        setCountryCode("AT");
        setDeliveryTime("1-3");
      }
    }
    
    if (activeModal === "weightRate") {
      if (selectedWeightRate) {
        setMinWeight(selectedWeightRate.minWeight.toString());
        setWeightMaxWeight(selectedWeightRate.maxWeight.toString());
        setPrice(formatEuroPrice(selectedWeightRate.price));
        setWeightRateTemplate("custom");
      } else {
        setMinWeight("0");
        setWeightMaxWeight("3");
        setPrice("0,00");
        setWeightRateTemplate("custom");
      }
    }
  }, [activeModal, selectedCarrier, selectedCountry, selectedWeightRate]);
  
  // Show banner when action is completed
  useEffect(() => {
    if (actionData) {
      setBannerVisible(true);
      const timer = setTimeout(() => {
        setBannerVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);
  
  // Helper to get country label from code
  const getCountryLabel = (code) => {
    const country = COUNTRIES.find(c => c.value === code);
    return country ? country.label : code;
  };
  
  // Helper to handle weight range template selection
  const handleWeightTemplateChange = (value) => {
    setWeightRateTemplate(value);
    if (value !== "custom") {
      const selectedRange = COMMON_WEIGHT_RANGES.find((_, index) => index.toString() === value);
      if (selectedRange) {
        setMinWeight(selectedRange.min.toString());
        setWeightMaxWeight(selectedRange.max.toString());
      }
    }
  };
  
  // Modal handling functions
  const openModal = (modalType, data = null) => {
    // Close any open modal first
    setActiveModal(modalType);
    
    // Set relevant data based on modal type
    if (modalType === "carrier") {
      setSelectedCarrier(data);
    } else if (modalType === "carrierDetails") {
      setCarrierForDetails(data);
    } else if (modalType === "country") {
      setSelectedCountryCarrier(data.carrier);
      setSelectedCountry(data.country);
    } else if (modalType === "weightRate") {
      setSelectedCountryForRate(data.country);
      setSelectedWeightRate(data.weightRate);
    }
  };
  
  const closeModal = () => {
    setActiveModal(null);
    
    // Reset all selection state
    setSelectedCarrier(null);
    setCarrierForDetails(null);
    setSelectedCountry(null);
    setSelectedCountryCarrier(null);
    setSelectedWeightRate(null);
    setSelectedCountryForRate(null);
    setWeightRateTemplate("custom");
  };
  
  // Carrier Handlers
  const handleRegisterCarrier = () => {
    submit({ action: "registerService" }, { method: "post" });
  };
  
  const handleOpenCarrierModal = (carrier = null) => {
    openModal("carrier", carrier);
  };
  
  const handleSaveCarrier = () => {
    const formData = new FormData();
    
    if (selectedCarrier) {
      formData.append("action", "updateCarrier");
      formData.append("id", selectedCarrier.id);
    } else {
      formData.append("action", "createCarrier");
    }
    
    formData.append("name", name);
    formData.append("maxWeight", maxWeight);
    
    submit(formData, { method: "post" });
    closeModal();
    
    // Force refresh after save to ensure data is fresh
    setTimeout(() => {
      forceRefresh();
    }, 500);
  };
  
  const handleDeleteCarrier = (id) => {
    if (window.confirm("Are you sure you want to delete this carrier?")) {
      const formData = new FormData();
      formData.append("action", "deleteCarrier");
      formData.append("id", id);
      
      submit(formData, { method: "post" });
      
      // Force refresh after delete to ensure data is fresh
      setTimeout(() => {
        forceRefresh();
      }, 500);
    }
  };
  
  // Carrier Details Handlers
  const handleViewCarrierDetails = (carrier) => {
    openModal("carrierDetails", carrier);
  };
  
  // Country Handlers
  const handleOpenCountryModal = (carrier, country = null) => {
    openModal("country", { carrier, country });
  };
  
  const handleSaveCountry = () => {
    const formData = new FormData();
    
    if (selectedCountry) {
      formData.append("action", "updateCountryRate");
      formData.append("id", selectedCountry.id);
    } else {
      formData.append("action", "addCountryRate");
      formData.append("carrierId", selectedCountryCarrier.id);
    }
    
    formData.append("countryCode", countryCode);
    formData.append("countryName", getCountryLabel(countryCode));
    formData.append("deliveryTime", deliveryTime);
    
    submit(formData, { method: "post" });
    closeModal();
    
    // Force refresh after save to ensure data is fresh
    setTimeout(() => {
      forceRefresh();
    }, 500);
  };
  
  const handleDeleteCountry = (id) => {
    if (window.confirm("Are you sure you want to delete this country?")) {
      const formData = new FormData();
      formData.append("action", "deleteCountryRate");
      formData.append("id", id);
      
      submit(formData, { method: "post" });
      closeModal();
      
      // Force refresh after delete to ensure data is fresh
      setTimeout(() => {
        forceRefresh();
      }, 500);
    }
  };
  
  // Weight Rate Handlers
  const handleOpenWeightRateModal = (country, weightRate = null) => {
    openModal("weightRate", { country, weightRate });
  };
  
  const handleSaveWeightRate = () => {
    const formData = new FormData();
    
    if (selectedWeightRate) {
      formData.append("action", "updateWeightRate");
      formData.append("id", selectedWeightRate.id);
    } else {
      formData.append("action", "addWeightRate");
      formData.append("countryRateId", selectedCountryForRate.id);
    }
    
    formData.append("minWeight", minWeight);
    formData.append("maxWeight", weightMaxWeight);
    formData.append("price", price);
    
    submit(formData, { method: "post" });
    closeModal();
    
    // Force refresh after save to ensure data is fresh
    setTimeout(() => {
      forceRefresh();
    }, 500);
  };
  
  const handleDeleteWeightRate = (id) => {
    if (window.confirm("Are you sure you want to delete this weight rate?")) {
      const formData = new FormData();
      formData.append("action", "deleteWeightRate");
      formData.append("id", id);
      
      submit(formData, { method: "post" });
      closeModal();
      
      // Force refresh after delete to ensure data is fresh
      setTimeout(() => {
        forceRefresh();
      }, 500);
    }
  };
  
  // Format carriers for the DataTable
  const rows = carriers.map(carrier => [
    <InlineStack gap="100" wrap={false} blockAlign="center">
      <Text fontWeight="bold">{carrier.name}</Text>
    </InlineStack>,
    `${carrier.maxWeight} kg`,
    <InlineStack gap="100" align="center">
      <Button size="slim" onClick={() => handleViewCarrierDetails(carrier)}>Details</Button>
      <Button size="slim" onClick={() => handleOpenCarrierModal(carrier)}>Edit</Button>
      <Button size="slim" destructive onClick={() => handleDeleteCarrier(carrier.id)}>Delete</Button>
    </InlineStack>
  ]);
  
  // Tab configuration for carrier details
  const tabs = [
    {
      id: 'countries',
      content: 'Countries & Weight Segments',
    },
    {
      id: 'settings',
      content: 'General Settings',
    },
  ];
  
  // Weight template options
  const weightTemplateOptions = [
    {label: "Custom", value: "custom"},
    ...COMMON_WEIGHT_RANGES.map((range, index) => ({
      label: range.label,
      value: index.toString()
    }))
  ];
  
  return (
    <Page>
      <TitleBar title="Shipping Cost Calculator" />
      <BlockStack gap="500">
        {bannerVisible && actionData && (
          <Banner
            title={actionData.message}
            status={actionData.success ? "success" : "critical"}
            onDismiss={() => setBannerVisible(false)}
          />
        )}
        
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Shipping Cost Calculator
                </Text>
                <Text as="p" variant="bodyMd">
                  This app calculates shipping costs based on order weight and carrier rates.
                  It automatically splits heavy orders into multiple parcels when needed, and selects the most cost-effective shipping option.
                </Text>
                
                <CalloutCard
                  title="Get started with your shipping calculator"
                  illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
                  primaryAction={{
                    content: 'Register Shipping Service',
                    onAction: handleRegisterCarrier,
                    loading: isLoading && navigation.formData?.get("action") === "registerService"
                  }}
                >
                  <p>Before you can use the shipping calculator, you need to register it with Shopify. This will allow the app to provide shipping rates during checkout.</p>
                </CalloutCard>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Carrier Management
                  </Text>
                  <Button 
                    primary 
                    onClick={() => handleOpenCarrierModal()}
                    disabled={isLoading}
                  >
                    Add Carrier
                  </Button>
                </InlineStack>
                
                {isLoading ? (
                  <SkeletonBodyText lines={5} />
                ) : carriers.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "text", "text"]}
                    headings={["Carrier Name", "Max Weight", "Actions"]}
                    rows={rows}
                    footerContent={`${carriers.length} ${carriers.length === 1 ? 'carrier' : 'carriers'}`}
                  />
                ) : (
                  <EmptyState
                    heading="No carriers configured yet"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    action={{
                      content: 'Add carrier',
                      onAction: () => handleOpenCarrierModal(),
                    }}
                  >
                    <p>Add your first carrier to start using the shipping calculator</p>
                  </EmptyState>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section oneThird>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  How it works
                </Text>
                
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    <Badge>1</Badge> Carrier Configuration
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Add your shipping carriers with their weight limits. Configure country-specific rates with weight segments.
                  </Text>
                </BlockStack>
                
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    <Badge>2</Badge> Automatic Parcel Splitting
                  </Text>
                  <Text as="p" variant="bodyMd">
                    When customers place orders, the app automatically splits them into multiple parcels if they exceed carrier weight limits.
                  </Text>
                </BlockStack>
                
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    <Badge>3</Badge> Optimal Carrier Selection
                  </Text>
                  <Text as="p" variant="bodyMd">
                    The app calculates the shipping cost for each carrier and selects the most cost-effective option automatically.
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
      
      {/* Carrier Modal */}
      <Modal
        open={activeModal === "carrier"}
        onClose={closeModal}
        title={selectedCarrier ? `Edit ${selectedCarrier.name}` : "Add New Carrier"}
        primaryAction={{
          content: "Save",
          onAction: handleSaveCarrier,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: closeModal,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Carrier Name"
              value={name}
              onChange={setName}
              autoComplete="off"
              error={name.trim() === "" ? "Carrier name is required" : undefined}
              helpText="Enter the name of the shipping carrier (e.g., DPD, Österreichische Post)"
              required
            />
            
            <TextField
              label="Maximum Weight (kg)"
              value={maxWeight}
              onChange={setMaxWeight}
              type="number"
              step="0.1"
              autoComplete="off"
              error={isNaN(parseFloat(maxWeight)) || parseFloat(maxWeight) <= 0 ? "Please enter a valid weight" : undefined}
              helpText="Maximum weight allowed per parcel in kilograms (e.g., 31.5 for DPD)"
              required
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
      
      {/* Country Modal */}
      <Modal
        open={activeModal === "country"}
        onClose={closeModal}
        title={selectedCountry ? `Edit ${getCountryLabel(selectedCountry.countryCode)}` : "Add Country"}
        primaryAction={{
          content: "Save",
          onAction: handleSaveCountry,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: closeModal,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Country"
              options={COUNTRIES}
              value={countryCode}
              onChange={setCountryCode}
              helpText="Select the country for this shipping rate"
              disabled={selectedCountry !== null}
            />
            
            <TextField
              label="Delivery Time (days)"
              value={deliveryTime}
              onChange={setDeliveryTime}
              autoComplete="off"
              helpText="Estimated delivery time (e.g., '1-3' for 1-3 days)"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
      
      {/* Weight Rate Modal */}
      <Modal
        open={activeModal === "weightRate"}
        onClose={closeModal}
        title={selectedWeightRate ? "Edit Weight Segment" : "Add Weight Segment"}
        primaryAction={{
          content: "Save",
          onAction: handleSaveWeightRate,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: closeModal,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Weight Range Template"
              options={weightTemplateOptions}
              value={weightRateTemplate}
              onChange={handleWeightTemplateChange}
              helpText="Select a predefined weight range or customize your own"
            />
            
            <TextField
              label="Minimum Weight (kg)"
              value={minWeight}
              onChange={setMinWeight}
              type="number"
              step="0.1"
              autoComplete="off"
              error={isNaN(parseFloat(minWeight)) || parseFloat(minWeight) < 0 ? "Please enter a valid weight" : undefined}
              helpText="Minimum weight for this segment (e.g., 0 for 0-3kg range)"
              required
            />
            
            <TextField
              label="Maximum Weight (kg)"
              value={weightMaxWeight}
              onChange={setWeightMaxWeight}
              type="number"
              step="0.1"
              autoComplete="off"
              error={isNaN(parseFloat(weightMaxWeight)) || parseFloat(weightMaxWeight) <= 0 || parseFloat(weightMaxWeight) <= parseFloat(minWeight) ? "Maximum weight must be greater than minimum weight" : undefined}
              helpText="Maximum weight for this segment (e.g., 3 for 0-3kg range)"
              required
            />
            
            <TextField
              label="Price (€)"
              value={price}
              onChange={setPrice}
              autoComplete="off"
              error={isNaN(parseFloat(price.replace(",", "."))) || parseFloat(price.replace(",", ".")) < 0 ? "Please enter a valid price" : undefined}
              helpText="Price for this weight range in euros (e.g., 5,00 for €5.00)"
              required
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
      
      {/* Carrier Details Modal */}
      <Modal
        open={activeModal === "carrierDetails"}
        onClose={closeModal}
        title={carrierForDetails ? `${carrierForDetails.name} Details` : "Carrier Details"}
        primaryAction={{
          content: "Close",
          onAction: closeModal,
        }}
        large
      >
        <Modal.Section>
          {carrierForDetails && (
            <>
              <Tabs
                tabs={tabs}
                selected={selectedTabIndex}
                onSelect={setSelectedTabIndex}
              />
              
              <div style={{ marginTop: '16px' }}>
                {selectedTabIndex === 0 ? (
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text variant="headingMd">Countries & Weight Segments</Text>
                      <Button onClick={() => handleOpenCountryModal(carrierForDetails)}>Add Country</Button>
                    </InlineStack>
                    
                    {carrierForDetails.countries.length === 0 ? (
                      <EmptyState
                        heading="No countries configured"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Add country-specific rates with weight segments to customize shipping costs by destination</p>
                      </EmptyState>
                    ) : (
                      <BlockStack gap="400">
                        {carrierForDetails.countries.map(country => (
                          <Card key={country.id}>
                            <BlockStack gap="400">
                              <InlineStack align="space-between">
                                <InlineStack gap="200">
                                  <Badge>{country.countryCode}</Badge>
                                  <Text variant="headingMd">{country.countryName}</Text>
                                </InlineStack>
                                <InlineStack gap="200">
                                  <Button size="slim" onClick={() => handleOpenCountryModal(carrierForDetails, country)}>Edit</Button>
                                  <Button size="slim" onClick={() => handleOpenWeightRateModal(country)}>Add Weight Segment</Button>
                                  <Button size="slim" destructive onClick={() => handleDeleteCountry(country.id)}>Delete</Button>
                                </InlineStack>
                              </InlineStack>
                              
                              {country.deliveryTime && (
                                <Text>Delivery time: {country.deliveryTime} days</Text>
                              )}
                              
                              <div style={{ marginTop: '8px' }}>
                                <Text variant="headingMd">Weight Segments</Text>
                                {country.weightRates && country.weightRates.length > 0 ? (
                                  <DataTable
                                    columnContentTypes={["text", "text", "text"]}
                                    headings={["Weight Range", "Price", "Actions"]}
                                    rows={country.weightRates.map(rate => [
                                      `${rate.minWeight} - ${rate.maxWeight} kg`,
                                      `€${formatEuroPrice(rate.price)}`,
                                      <InlineStack>
                                        <Button size="slim" onClick={() => handleOpenWeightRateModal(country, rate)}>Edit</Button>
                                        <Button size="slim" destructive onClick={() => handleDeleteWeightRate(rate.id)}>Delete</Button>
                                      </InlineStack>
                                    ])}
                                  />
                                ) : (
                                  <EmptyState
                                    heading="No weight segments configured"
                                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                                  >
                                    <p>Add weight segments to define pricing for different weight ranges</p>
                                  </EmptyState>
                                )}
                              </div>
                            </BlockStack>
                          </Card>
                        ))}
                      </BlockStack>
                    )}
                  </BlockStack>
                ) : (
                  <BlockStack gap="400">
                    <Card>
                      <BlockStack gap="400">
                        <Text variant="headingMd">General Settings</Text>
                        <DataTable
                          columnContentTypes={["text", "text"]}
                          headings={["Setting", "Value"]}
                          rows={[
                            ["Carrier Name", carrierForDetails.name],
                            ["Maximum Weight", `${carrierForDetails.maxWeight} kg`],
                          ]}
                        />
                        <Text variant="bodyMd">
                          These settings define the carrier's general properties. Use the Countries & Weight Segments tab to configure pricing.
                        </Text>
                        <Button onClick={() => handleOpenCarrierModal(carrierForDetails)}>Edit Settings</Button>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}
              </div>
            </>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}