// app/routes/app.shipping.jsx
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
  Icon,
  Link,
  EmptyState,
  Badge,
  SkeletonBodyText,
  Tooltip,
  CalloutCard,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useSubmit, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getCarriers, createCarrier, updateCarrier, deleteCarrier } from "../models/carrier.server";

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
      const baseCost = parseFloat(formData.get("baseCost"));
      const costPerKg = parseFloat(formData.get("costPerKg"));
      
      await createCarrier({ name, maxWeight, baseCost, costPerKg });
      
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
      const baseCost = parseFloat(formData.get("baseCost"));
      const costPerKg = parseFloat(formData.get("costPerKg"));
      
      await updateCarrier(id, { name, maxWeight, baseCost, costPerKg });
      
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
  } catch (error) {
    console.error("Error performing action:", error);
    return json({ 
      success: false, 
      message: `Error: ${error.message}` 
    });
  }
};

export default function ShippingCalculator() {
  const { carriers } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [maxWeight, setMaxWeight] = useState("31.5");
  const [baseCost, setBaseCost] = useState("500");
  const [costPerKg, setCostPerKg] = useState("100");
  
  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isModalOpen && selectedCarrier) {
      setName(selectedCarrier.name);
      setMaxWeight(selectedCarrier.maxWeight.toString());
      setBaseCost(selectedCarrier.baseCost.toString());
      setCostPerKg(selectedCarrier.costPerKg.toString());
    } else if (isModalOpen) {
      // Default values for new carrier
      setName("");
      setMaxWeight("31.5");
      setBaseCost("500");
      setCostPerKg("100");
    }
  }, [isModalOpen, selectedCarrier]);
  
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
  
  const handleRegisterCarrier = () => {
    submit({ action: "registerService" }, { method: "post" });
  };
  
  const handleOpenModal = (carrier = null) => {
    setSelectedCarrier(carrier);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCarrier(null);
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
    formData.append("baseCost", baseCost);
    formData.append("costPerKg", costPerKg);
    
    submit(formData, { method: "post" });
    handleCloseModal();
  };
  
  const handleDeleteCarrier = (id) => {
    if (window.confirm("Are you sure you want to delete this carrier?")) {
      const formData = new FormData();
      formData.append("action", "deleteCarrier");
      formData.append("id", id);
      
      submit(formData, { method: "post" });
    }
  };
  
  // Format carriers for the DataTable
  const rows = carriers.map(carrier => [
    <InlineStack gap="100" wrap={false} blockAlign="center">
      <Text fontWeight="bold">{carrier.name}</Text>
    </InlineStack>,
    `${carrier.maxWeight} kg`,
    `$${(carrier.baseCost / 100).toFixed(2)}`,
    `$${(carrier.costPerKg / 100).toFixed(2)}`,
    <InlineStack gap="100" align="center">
      <Button size="slim" onClick={() => handleOpenModal(carrier)}>Edit</Button>
      <Button size="slim" destructive onClick={() => handleDeleteCarrier(carrier.id)}>Delete</Button>
    </InlineStack>
  ]);
  
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
                    onClick={() => handleOpenModal()}
                    disabled={isLoading}
                  >
                    Add Carrier
                  </Button>
                </InlineStack>
                
                {isLoading && carriers.length === 0 ? (
                  <SkeletonBodyText lines={5} />
                ) : carriers.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text", "text"]}
                    headings={["Carrier Name", "Max Weight", "Base Cost", "Cost per kg", "Actions"]}
                    rows={rows}
                    footerContent={`${carriers.length} ${carriers.length === 1 ? 'carrier' : 'carriers'}`}
                  />
                ) : (
                  <EmptyState
                    heading="No carriers configured yet"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    action={{
                      content: 'Add carrier',
                      onAction: () => handleOpenModal(),
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
                    Add your shipping carriers with their weight limits and pricing. For example, configure DPD with a max weight of 31.5 kg.
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
      
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCarrier ? `Edit ${selectedCarrier.name}` : "Add New Carrier"}
        primaryAction={{
          content: "Save",
          onAction: handleSaveCarrier,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCloseModal,
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
            
            <TextField
              label="Base Cost (cents)"
              value={baseCost}
              onChange={setBaseCost}
              type="number"
              autoComplete="off"
              error={isNaN(parseFloat(baseCost)) || parseFloat(baseCost) < 0 ? "Please enter a valid cost" : undefined}
              helpText="Base cost for each parcel in cents (500 = $5.00)"
              required
            />
            
            <TextField
              label="Cost per kg (cents)"
              value={costPerKg}
              onChange={setCostPerKg}
              type="number"
              autoComplete="off"
              error={isNaN(parseFloat(costPerKg)) || parseFloat(costPerKg) < 0 ? "Please enter a valid cost" : undefined}
              helpText="Additional cost per kg in cents (100 = $1.00/kg)"
              required
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}