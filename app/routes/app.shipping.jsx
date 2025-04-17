import { useState } from "react";
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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useSubmit, useActionData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  try {
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
  } catch (error) {
    console.error("Error registering carrier service:", error);
    return json({ 
      success: false, 
      message: `Failed to register carrier: ${error.message}` 
    });
  }
};

export default function ShippingCalculator() {
  const actionData = useActionData();
  const submit = useSubmit();
  const [weight, setWeight] = useState("1");
  const [price, setPrice] = useState("1000");
  
  const handleRegisterCarrier = () => {
    submit({}, { method: "post" });
  };
  
  return (
    <Page>
      <TitleBar title="Shipping Cost Calculator" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Shipping Cost Calculator MVP
              </Text>
              <Text as="p" variant="bodyMd">
                This MVP demonstrates a basic shipping calculator that provides fixed-rate shipping based on weight.
              </Text>
              
              <FormLayout>
                <TextField
                  label="Default price (in cents)"
                  value={price}
                  onChange={setPrice}
                  type="number"
                  helpText="This is the base price for shipping in cents (1000 = $10.00)"
                  autoComplete="off"
                />
                
                <TextField
                  label="Max weight per parcel (kg)"
                  value={weight}
                  onChange={setWeight}
                  type="number"
                  helpText="Maximum weight per shipping parcel in kilograms"
                  autoComplete="off"
                />
              </FormLayout>
              
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
        
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                How it works
              </Text>
              <Text as="p" variant="bodyMd">
                1. Register the shipping service with the button above
              </Text>
              <Text as="p" variant="bodyMd">
                2. Add products to your cart in your Shopify store
              </Text>
              <Text as="p" variant="bodyMd">
                3. Go to checkout and see the calculated shipping rate
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}