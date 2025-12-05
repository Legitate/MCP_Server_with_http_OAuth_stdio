/**
 * Example: How to use the MCP Server API
 * 
 * This demonstrates the complete OAuth flow:
 * 1. Register a client
 * 2. Get an access token
 * 3. Make authenticated API calls
 */

const BASE_URL = 'http://127.0.0.1:8080';

// Step 1: Register a client
async function registerClient() {
  console.log('Step 1: Registering client...');
  const response = await fetch(`${BASE_URL}/mcp/register`, {
    method: 'POST'
  });
  const client = await response.json();
  console.log('✓ Client registered:', client.client_id);
  return client;
}

// Step 2: Get an access token
async function getToken(clientId, clientSecret) {
  console.log('Step 2: Getting access token...');
  const response = await fetch(`${BASE_URL}/mcp/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  const tokenData = await response.json();
  
  if (tokenData.error) {
    throw new Error(`Token error: ${tokenData.error}`);
  }
  
  console.log('✓ Access token received (expires in', tokenData.expires_in, 'seconds)');
  return tokenData;
}

// Step 3: Create an employee
async function createEmployee(accessToken, employeeData) {
  console.log('Step 3: Creating employee...');
  const response = await fetch(`${BASE_URL}/mcp/call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'employee_create',
      params: employeeData
    })
  });
  
  if (response.status === 401) {
    const error = await response.json();
    throw new Error(`Unauthorized: ${error.message}`);
  }
  
  const result = await response.json();
  console.log('✓ Employee created:', result.employee);
  return result;
}

// Step 4: List all employees
async function listEmployees(accessToken) {
  console.log('Step 4: Listing employees...');
  const response = await fetch(`${BASE_URL}/mcp/call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'employee_list',
      params: {}
    })
  });
  
  const result = await response.json();
  console.log('✓ Employees:', result.employees);
  return result;
}

// Main execution
async function main() {
  try {
    console.log('=== MCP Server API Example ===\n');
    
    // Step 1: Register client
    const client = await registerClient();
    
    // Step 2: Get token
    const tokenData = await getToken(client.client_id, client.client_secret);
    
    // Step 3: Create employee
    await createEmployee(tokenData.access_token, {
      name: 'John Doe',
      department: 'Engineering',
      role: 'SWE',
      email: 'john@example.com'
    });
    
    // Step 4: List employees
    await listEmployees(tokenData.access_token);
    
    console.log('\n=== Example Complete ===');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { registerClient, getToken, createEmployee, listEmployees };

