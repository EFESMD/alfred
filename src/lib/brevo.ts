/**
 * Brevo (formerly Sendinblue) API Utility
 */

export async function addContactToMailingList({
  email,
  firstName,
  lastName,
}: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  const apiKey = process.env.EMAIL_SERVER_PASSWORD;
  const listId = 3; // Provided List ID

  if (!apiKey) {
    console.error("[BREVO] Missing API Key (EMAIL_SERVER_PASSWORD).");
    return;
  }

  console.log(`[BREVO] Adding ${email} to list #${listId}...`);

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME: lastName,
        },
        listIds: [listId],
        updateEnabled: true, // Update existing contact if they already exist
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[BREVO_API_ERROR]", JSON.stringify(errorData));
      return;
    }

    const data = await response.json();
    console.log("[BREVO_SUCCESS] Contact added/updated:", data.id || email);
  } catch (error) {
    console.error("[BREVO_FATAL_ERROR]", error);
  }
}
