// Test the correct Z-API endpoint format
import fetch from 'node-fetch';

async function testCorrectEndpoint() {
  const instanceId = '3DF871A7ADFB20FB49998E66062CE0C1';
  const token = 'A4E42029C248B72DA0842F47';
  const clientToken = 'F8A7C4DC7B1B4B029F6B8E7A9D3C5E6F';
  const testPhone = '5511957851330';
  
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/profile-picture?phone=${testPhone}`;
  
  console.log('Testing correct endpoint:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Client-Token': clientToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.link) {
        console.log('SUCCESS! Found profile picture URL:', data.link);
      } else {
        console.log('No profile picture found in response');
      }
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Request error:', error.message);
  }
}

testCorrectEndpoint();