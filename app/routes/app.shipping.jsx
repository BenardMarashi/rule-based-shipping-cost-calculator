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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useSubmit, useActionData, useLoaderData } from "@remix-run/react";
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
        message: "Shipping carrier service registered successfully!" 
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  
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
    const formData = new FormData();
    formData.append("action", "deleteCarrier");
    formData.append("id", id);
    
    submit(formData, { method: "post" });
  };
  
  // Format carriers for the DataTable
  const rows = carriers.map(carrier => [
    carrier.name,
    `${carrier.maxWeight} kg`,
    `$${(carrier.baseCost / 100).toFixed(2)}`,
    `$${(carrier.costPerKg / 100).toFixed(2)}`,
    <Button onClick={() => handleOpenModal(carrier)}>Edit</Button>,
    <Button destructive onClick={() => handleDeleteCarrier(carrier.id)}>Delete</Button>
  ]);
  
  return (
    <Page>
      <TitleBar title="Shipping Cost Calculator" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Shipping Cost Calculator
              </Text>
              <Text as="p" variant="bodyMd">
                This app calculates shipping costs based on order weight and carrier rates.
                It splits heavy orders into multiple parcels when needed.
              </Text>
              
              <Button primary onClick={handleRegisterCarrier}>
                Register Shipping Service
              </Button>
              
              {actionData && (
                <Banner
                  title={actionData.message}
                  status={actionData.success ? "success" : "critical"}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Carrier Management
              </Text>
              
              <Button onClick={() => handleOpenModal()}>Add Carrier</Button>
              
              {carriers.length > 0 ? (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text", "text"]}
                  headings={["Name", "Max Weight", "Base Cost", "Cost per kg", "Edit", "Delete"]}
                  rows={rows}
                />
              ) : (
                <Text as="p" variant="bodyMd">
                  No carriers configured yet. Add your first carrier to get started.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCarrier ? "Edit Carrier" : "Add Carrier"}
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
              required
            />
            
            <TextField
              label="Maximum Weight (kg)"
              value={maxWeight}
              onChange={setMaxWeight}
              type="number"
              step="0.1"
              autoComplete="off"
              required
            />
            
            <TextField
              label="Base Cost (cents)"
              value={baseCost}
              onChange={setBaseCost}
              type="number"
              helpText="Base cost in cents (500 = $5.00)"
              autoComplete="off"
              required
            />
            
            <TextField
              label="Cost per kg (cents)"
              value={costPerKg}
              onChange={setCostPerKg}
              type="number"
              helpText="Additional cost per kg in cents (100 = $1.00/kg)"
              autoComplete="off"
              required
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}