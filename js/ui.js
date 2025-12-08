function createToastContainer() {
	let container = document.querySelector('.toast-container');
	if (!container) {
		container = document.createElement('div');
		container.className = 'toast-container';
		document.body.appendChild(container);
	}
	return container;
}

function showToast(message, type = 'info', timeout = 3000) {
	const container = createToastContainer();

	const toast = document.createElement('div');
	toast.className = `toast-message toast-${type}`;
	toast.textContent = message;

	container.appendChild(toast);

	setTimeout(() => {
		toast.classList.add('hide');
		setTimeout(() => toast.remove(), 300);
	}, timeout);
}
