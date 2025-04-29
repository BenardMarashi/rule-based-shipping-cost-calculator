import { useEffect } from "react";
import { Link as RemixLink } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  InlineStack,
  Banner,
  CalloutCard,
  Divider,
  Link
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <Page>
      <TitleBar title="Shipping Cost Calculator" />
      <BlockStack gap="500">
        <Banner
          title="Welcome to the Rule-Based Shipping Cost Calculator"
          status="info"
        >
          <p>This app automatically splits orders into parcels based on carrier weight limits and selects the most cost-effective shipping option.</p>
        </Banner>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Optimize Your Shipping Costs
                  </Text>
                  <Text variant="bodyMd" as="p">
                    According to research by the Baymard Institute, nearly 50% of online shoppers abandon their carts due to shipping costs. 
                    This app helps you reduce cart abandonment by providing transparent, optimized shipping rates.
                  </Text>
                </BlockStack>
                
                <CalloutCard
                  title="Get Started with Your Shipping Calculator"
                  illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
                  primaryAction={{
                    content: 'Go to Shipping Calculator',
                    url: '/app/shipping'
                  }}
                >
                  <p>Configure your carriers, register the shipping service, and start providing optimized shipping rates to your customers.</p>
                </CalloutCard>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section oneThird>
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Quick Links
                  </Text>
                  <List>
                    <List.Item>
                      <Link url="/app/shipping">Shipping Calculator Setup</Link>
                    </List.Item>
                    <List.Item>
                      <Link url="/app/shipping">Carrier Management</Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
        
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">How It Works</Text>
            
            <Layout>
              <Layout.Section oneThird>
                <BlockStack gap="200" alignment="center">
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <img 
                      src="https://cdn.shopify.com/s/files/1/0533/2089/files/food-icons-26.png?v=1530129177" 
                      alt="Carrier Setup" 
                      width="100"
                    />
                  </div>
                  <Text as="h3" variant="headingMd" alignment="center">
                    1. Configure Carriers
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Add your shipping carriers with their weight limits, pricing, and delivery regions. For example, configure DPD with max weight of 31.5 kg and country-specific pricing.
                  </Text>
                </BlockStack>
              </Layout.Section>
              
              <Layout.Section oneThird>
                <BlockStack gap="200" alignment="center">
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <img 
                      src="https://cdn.shopify.com/s/files/1/0533/2089/files/package-icon.png?v=1530205723" 
                      alt="Parcel Splitting" 
                      width="100"
                    />
                  </div>
                  <Text as="h3" variant="headingMd" alignment="center">
                    2. Automatic Parcel Splitting
                  </Text>
                  <Text as="p" variant="bodyMd">
                    When customers place orders, the app automatically splits them into multiple parcels if they exceed carrier weight limits using a bin-packing algorithm.
                  </Text>
                </BlockStack>
              </Layout.Section>
              
              <Layout.Section oneThird>
                <BlockStack gap="200" alignment="center">
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <img 
                      src="https://cdn.shopify.com/s/files/1/0533/2089/files/shopify-settings-icon.png?v=1559331497" 
                      alt="Carrier Selection" 
                      width="100"
                    />
                  </div>
                  <Text as="h3" variant="headingMd" alignment="center">
                    3. Optimal Carrier Selection
                  </Text>
                  <Text as="p" variant="bodyMd">
                    The app calculates the shipping cost for each carrier based on weight divisions and destination, then selects the most cost-effective option automatically.
                  </Text>
                </BlockStack>
              </Layout.Section>
            </Layout>
          </BlockStack>
        </Card>
        
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">Tutorial: Setting Up Your Shipping Calculator</Text>
            
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Step 1: Configure Your Carriers</Text>
              <Text as="p" variant="bodyMd">
                Navigate to the <Link url="/app/shipping">Shipping Calculator</Link> page and add your shipping carriers. For each carrier, you'll need to specify:
              </Text>
              <List type="bullet">
                <List.Item>Carrier name (e.g., DPD, Österreichische Post)</List.Item>
                <List.Item>Maximum weight per parcel (e.g., 31.5 kg for DPD)</List.Item>
                <List.Item>Base shipping cost</List.Item>
                <List.Item>Cost per kilogram</List.Item>
              </List>
              
              <Divider />
              
              <Text as="h3" variant="headingMd">Step 2: Register Your Shipping Service</Text>
              <Text as="p" variant="bodyMd">
                After adding your carriers, click the "Register Shipping Service" button to connect your app with Shopify's checkout system. This step is essential for your calculated shipping rates to appear during checkout.
              </Text>
              
              <Divider />
              
              <Text as="h3" variant="headingMd">Step 3: Test Your Setup</Text>
              <Text as="p" variant="bodyMd">
                Create a test order in your store and proceed to checkout. You should see your shipping carrier options with the optimized rates. The app will automatically:
              </Text>
              <List type="bullet">
                <List.Item>Split heavy orders into multiple parcels if needed</List.Item>
                <List.Item>Select the most cost-effective carrier based on order weight and destination</List.Item>
                <List.Item>Display transparent shipping costs to your customers</List.Item>
              </List>
            </BlockStack>
          </BlockStack>
        </Card>
        
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">Benefits</Text>
            <Layout>
              <Layout.Section oneHalf>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">For Merchants</Text>
                  <List>
                    <List.Item>Reduce shipping costs through optimized carrier selection</List.Item>
                    <List.Item>Lower cart abandonment rates with transparent shipping</List.Item>
                    <List.Item>Save time with automated parcel splitting and carrier selection</List.Item>
                    <List.Item>Improve customer satisfaction with reliable shipping</List.Item>
                  </List>
                </BlockStack>
              </Layout.Section>
              
              <Layout.Section oneHalf>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">For Customers</Text>
                  <List>
                    <List.Item>Clear shipping costs displayed at checkout</List.Item>
                    <List.Item>No surprise fees or hidden costs</List.Item>
                    <List.Item>Optimized shipping options for their location</List.Item>
                    <List.Item>Reliable delivery estimates based on carrier data</List.Item>
                  </List>
                </BlockStack>
              </Layout.Section>
            </Layout>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}