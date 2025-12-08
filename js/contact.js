const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const contactButton = document.querySelector('.btn.primary.full');

  if (!contactButton) {
    console.error('Contact button not found');
    return;
  }

  contactButton.addEventListener('click', async function (e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const genderInput = document.querySelector('input[name="gender"]:checked');
    const mobile = document.getElementById('mobile').value.trim();
    const dob = document.getElementById('dob').value;
    const email = document.getElementById('email').value.trim();
    const language = document.getElementById('language').value;
    const message = document.getElementById('message').value.trim();

    if (!firstName || !lastName || !genderInput || !mobile || !dob || !email || !language || !message) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          gender: genderInput.value,
          mobile,
          dob,
          email,
          language,
          message
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || 'Error sending message. Please try again.');
        return;
      }

      alert('Thank you for your message! We will get back to you soon.');

      // تفريغ الحقول بعد الإرسال
      document.getElementById('firstName').value = '';
      document.getElementById('lastName').value = '';
      document.querySelectorAll('input[name="gender"]').forEach(radio => radio.checked = false);
      document.getElementById('mobile').value = '';
      document.getElementById('dob').value = '';
      document.getElementById('email').value = '';
      document.getElementById('language').value = '';
      document.getElementById('message').value = '';

    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  });
});
