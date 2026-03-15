document.addEventListener('DOMContentLoaded', () => {
    const docList = document.getElementById('document-list');
    const viewerContent = document.getElementById('viewer-content');
    const epubNav = document.getElementById('epub-nav');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');

    // --- CONFIGURATION ---
    // Remplacez les valeurs ci-dessous par votre nom d'utilisateur et le nom de votre dépôt GitHub.
    const GITHUB_USER = 'devmarcpro';
    const GITHUB_REPO = 'LibPerso';
    // --- FIN DE LA CONFIGURATION ---

    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/docs`;

    /**
     * Récupère les documents depuis l'API GitHub et peuple la barre latérale.
     */
    async function fetchDocuments() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Erreur réseau : ${response.statusText}`);
            }
            const files = await response.json();

            docList.innerHTML = ''; // Vide la liste existante

            const supportedFiles = files.filter(file =>
                file.type === 'file' && (file.name.endsWith('.pdf') || file.name.endsWith('.epub'))
            );

            if (supportedFiles.length === 0) {
                docList.innerHTML = '<li>Aucun document .pdf ou .epub trouvé dans le dossier /docs.</li>';
                return;
            }

            supportedFiles.forEach(file => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.textContent = file.name;
                a.href = '#';
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    displayDocument(file);
                });
                li.appendChild(a);
                docList.appendChild(li);
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des documents:', error);
            docList.innerHTML = `<li>Erreur: Impossible de charger les documents. Vérifiez la console et votre configuration.</li>`;
            viewerContent.innerHTML = `<p style="color:red;"><strong>Erreur de chargement :</strong> ${error.message}. <br><br>Veuillez vérifier que les valeurs de GITHUB_USER et GITHUB_REPO sont correctement définies dans <code>script.js</code>.</p>`;
        }
    }

    /**
     * Affiche le document sélectionné dans la zone de lecture.
     * @param {object} file - L'objet fichier provenant de l'API GitHub.
     */
    function displayDocument(file) {
        viewerContent.innerHTML = ''; // Nettoie la zone de lecture
        epubNav.style.display = 'none'; // Cache la navigation EPUB par défaut

        const fileExtension = file.name.split('.').pop().toLowerCase();
        // Utiliser download_url pour un accès direct au contenu brut du fichier
        const fileUrl = file.download_url;

        if (fileExtension === 'pdf') {
            const iframe = document.createElement('iframe');
            iframe.src = fileUrl;
            viewerContent.appendChild(iframe);
        } else if (fileExtension === 'epub') {
            // Créer un conteneur dédié pour EPUB.js à l'intérieur de viewer-content
            const epubContainer = document.createElement('div');
            epubContainer.id = 'epub-viewer';
            viewerContent.appendChild(epubContainer);

            const book = ePub(fileUrl);
            const rendition = book.renderTo('epub-viewer', {
                width: '100%',
                height: '100%'
            });
            
            rendition.display();
            
            // Gérer les boutons de navigation
            prevButton.onclick = () => rendition.prev();
            nextButton.onclick = () => rendition.next();
            epubNav.style.display = 'flex'; // Affiche la navigation

            // Mettre à jour les boutons Précédent/Suivant lors du changement de page
            rendition.on('relocated', (location) => {
                // book.locations.length() est une promesse, donc nous devons l'attendre
                book.locations.generate(1024).then(() => {
                    const currentLocation = book.locations.locationFromCfi(location.start.cfi);
                    const totalLocations = book.locations.length();
                    prevButton.disabled = currentLocation === 0;
                    nextButton.disabled = currentLocation === totalLocations - 1;
                });
            });
        }
    }

    // Lance la récupération des documents au chargement de la page
    fetchDocuments();
});
