	function increaseQuantity() {
		const input = document.getElementById('quantity');
		const currentValue = parseInt(input.value);
		if (currentValue < 10) {
			input.value = currentValue + 1;
		}
	}

	function decreaseQuantity() {
		const input = document.getElementById('quantity');
		const currentValue = parseInt(input.value);
		if (currentValue > 1) {
			input.value = currentValue - 1;
		}
	}