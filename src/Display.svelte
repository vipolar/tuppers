<script>
	import { onMount } from 'svelte';
	
	let windowWidth;
	
	const debounce = (func, delay) => {
		let timer;

		return function () {
			const context = this;
			const args = arguments;
			clearTimeout(timer);
			timer = setTimeout(() => func.apply(context, args), delay);
		};
	};
	
	const setWindowWidth = () => {
		windowWidth = `${window.innerWidth}px`;
	};
	
	const debouncedSetWindowWidth = debounce(setWindowWidth, 300);
	
	onMount(() => {		
		window.addEventListener('resize', debouncedSetWindowWidth);
		
		return () => {
			window.removeEventListener('resize', debouncedSetWindowWidth);
		}
	});
</script>

{#if windowWidth}
	<p>{windowWidth}</p>
{/if}