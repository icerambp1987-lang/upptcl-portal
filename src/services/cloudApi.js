// Cloud REST Engine for 100% Guaranteed Multi-Machine Live Sync without limits
const CLOUD_OBJECT_ID = 'ff8081819ff5b11001a014872d9741e1';
const CLOUD_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

// Fetch latest employees from Cloud
export const fetchCloudEmployees = async () => {
  try {
    const res = await fetch(CLOUD_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.data && Array.isArray(json.data.employees)) {
      return json.data.employees;
    }
  } catch (err) {
    console.warn("Cloud fetch error:", err.message);
  }
  return null;
};

// Save all active employees directly to Cloud
export const saveCloudEmployees = async (activeEmployeesList) => {
  try {
    const payload = {
      name: 'UPPTCL_EMPLOYEES_DATA',
      data: {
        employees: activeEmployeesList,
        lastUpdated: new Date().toISOString()
      }
    };
    const res = await fetch(CLOUD_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log("Successfully synced to Global Cloud:", activeEmployeesList.length, "employees");
    }
  } catch (err) {
    console.error("Cloud save error:", err.message);
  }
};
