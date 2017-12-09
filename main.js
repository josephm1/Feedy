//Intial function
'Use strict';
(async function() {
	try {
		$('#send-message').click(function() {
			sendMessage();
		});

		const app = {
			name: 'Feedy',
			id: 'joe',
			version: '1',
			vendor: 'feedy.joe'
		};

		let appHandle = await window.safeApp.initialise(app);
		auth = await window.safeApp.connect(appHandle);
		Materialize.toast(' App Token: ' + auth, 3000, 'rounded');
	} catch (err) {
		console.error(err);
	} finally {
		authorised = false;
		getMessages();
	}
})();

async function getMessages() {
	try {
		let feedyHash = await window.safeCrypto.sha3Hash(auth, 'feedy');
		let feedyHandle = await window.safeMutableData.newPublic(auth, feedyHash, 54321);
		let entriesHandle = await window.safeMutableData.getEntries(feedyHandle);

		loadingMessage.innerHTML = '';
		messages.innerHTML = '';
		let time = new Date().getTime();

		window.safeMutableDataEntries.forEach(
			entriesHandle,
			(keysobject, value) => {
				let key = uintToString(keysobject);
				if (
					value.buf.toString().length < 300 &&
					value.buf.toString() !== '' &&
					parseInt(key) < time &&
					parseInt(key).toString().length === 13
					// key.length === 13
				) {
					console.log(value.buf.toString());
					i = key;
					let date = new Date(parseInt(key));
					let timestamp =
						('0' + date.getDate()).slice(-2) +
						'/' +
						('0' + (date.getMonth() + 1)).slice(-2) +
						'/' +
						date.getFullYear() +
						' ' +
						('0' + date.getHours()).slice(-2) +
						':' +
						('0' + date.getMinutes()).slice(-2);

					$('#messages').append(
						'<div class="card-panel accent-colour item"><p class="primary-text-colour">' +
							value.buf.toString() +
							' <br>' +
							timestamp +
							'</p></div>'
					);
				}
				window.scrollTo(0, document.body.scrollHeight);
			},
			err => {
				console.error(err);
			}
		);
		window.safeMutableDataEntries.free(entriesHandle);
	} catch (err) {
		console.error(err);
	}
}

async function authorise() {
	try {
		if (authorised !== true) {
			window.safeApp.free(auth);

			const app = {
				name: 'Feedy',
				id: 'joe',
				version: '1',
				vendor: 'feedy.joe'
			};
			const permissions = {
				_public: ['Read']
			};

			const owncontainer = {
				own_container: true
			};

			let appHandle = await window.safeApp.initialise(app);
			let authURI = await window.safeApp.authorise(appHandle, permissions, owncontainer);
			let authorisedAppHandle = await window.safeApp.connectAuthorised(appHandle, authURI);

			auth = authorisedAppHandle;
			authorised = true;
			Materialize.toast('Authorised App Token: ' + auth, 3000, 'rounded');
			getMessages();
			return auth;
		}
	} catch (err) {
		console.error(err);
	}
}

async function sendMessage() {
	try {
		if (authorised !== true) {
			const auth = await authorise();
		}

		let time = new Date().getTime().toString();

		let feedyHash = await window.safeCrypto.sha3Hash(auth, 'feedy');
		let feedyHandle = await window.safeMutableData.newPublic(auth, feedyHash, 54321);
		let mutationHandle = await window.safeMutableData.newMutation(auth);
		window.safeMutableDataMutation.insert(mutationHandle, time, messagearea.value);
		window.safeMutableData.applyEntriesMutation(feedyHandle, mutationHandle);
		window.safeMutableDataMutation.free(mutationHandle);
		window.safeMutableData.free(feedyHandle);
		messagearea.value = '';
	} catch (err) {
		console.error(err);
	} finally {
		Materialize.toast('Message has been sent to the network', 3000, 'rounded');
		setTimeout(function() {
			getMessages();
		}, 2000);
	}
}

function uintToString(key) {
	let uintArray = new Uint8Array(Object.values(key));
	return new TextDecoder('utf-8').decode(uintArray);
}
