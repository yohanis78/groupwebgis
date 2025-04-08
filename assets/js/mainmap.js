// Inisialisasi Peta
var map = L.map('map').setView([-6.1754, 106.8272], 10);

// Tambahkan Tile Layer
var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: ''
}).addTo(map);

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: ''
});

var Esri_WorldShadedRelief = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
	maxZoom: 13
});



// --- Layer untuk Data GeoJSON ---
var batas = null;
var filteredLayer = L.geoJSON(null, {
    style: function(feature) {
        return {
            color: feature.properties.Warna || "blue", // Gunakan warna dari atribut "Warna"
            weight: 1.5,
            fillOpacity: 0.7
        };
    },
    onEachFeature: function(feature, layer) {
        var kecamatan = feature.properties.WADMKC || "Tidak Ada Data";
        var kabupaten = feature.properties.WADMKK || "Tidak Ada Data";
        layer.bindPopup(`<b>${kecamatan}, ${kabupaten}</b>`);
    }
}).addTo(map);

// --- Muat GeoJSON ---
batas = new L.geoJSON.ajax("assets/GeoJSON/ProvinsiJakarta.geojson", {
    style: function(feature) {
        return { color: "gray", weight: 0.5, fillOpacity: 0.2 };
    },
    onEachFeature: function(feature, layer) {
        var kecamatan = feature.properties.WADMKC || "Tidak Ada Data";
        var kabupaten = feature.properties.WADMKK || "Tidak Ada Data";
        layer.bindPopup(`<b>${kecamatan}, ${kabupaten}</b>`);
    }
});
batas.on('data:loaded', function() {
    populateSuggestions();
});
batas.addTo(map);

// --- Daftar Kabupaten/Kota Jakarta ---
var kabupatenList = [
    "Jakarta Pusat",
    "Jakarta Utara",
    "Jakarta Timur",
    "Jakarta Selatan",
    "Jakarta Barat",
    "Kepulauan Seribu"
];

// --- Ambil Kecamatan Unik untuk Autocomplete ---
function populateSuggestions() {
    var kecamatanSet = new Set();

    batas.eachLayer(function(layer) {
        var props = layer.feature.properties;
        if (props.WADMKC) kecamatanSet.add(props.WADMKC);
    });

    var kecamatanList = [...kecamatanSet].sort();

    // Tambahkan ke <datalist>
    addToDatalist("kecamatanList", kecamatanList);
    addToDatalist("kabupatenList", kabupatenList);
}

// Fungsi untuk menambahkan opsi ke <datalist>
function addToDatalist(id, items) {
    var suggestionList = document.getElementById(id);
    suggestionList.innerHTML = ""; 
    items.forEach(function(name) {
        var option = document.createElement("option");
        option.value = name;
        suggestionList.appendChild(option);
    });
}

// --- 🔍 Filter Peta berdasarkan Input ---
function queryGeoJSON() {
    var kecamatanTerm = document.getElementById("searchKecamatan").value.toLowerCase();
    var kabupatenTerm = document.getElementById("searchKabupaten").value.toLowerCase();
    
    // Kosongkan Layer Filtered
    filteredLayer.clearLayers();

    batas.eachLayer(function(layer) {
        var props = layer.feature.properties;
        var kecamatan = props.WADMKC ? props.WADMKC.toLowerCase() : "";
        var kabupaten = props.WADMKK ? props.WADMKK.toLowerCase() : "";
        var warna = props.Warna || "blue"; 

        if ((kecamatanTerm && kecamatan === kecamatanTerm) || (kabupatenTerm && kabupaten === kabupatenTerm)) {
            var newFeature = JSON.parse(JSON.stringify(layer.feature)); 
            newFeature.properties.Warna = warna; 
            filteredLayer.addData(newFeature);
        }
    });

    if (filteredLayer.getLayers().length > 0) {
        map.fitBounds(filteredLayer.getBounds());
    } else {
        alert("Data tidak ditemukan!");
    }
}

// --- Event Listener Tombol Cari ---
document.getElementById("searchButton").addEventListener("click", queryGeoJSON);

// --- Layer Control ---
var baseMaps = {
    "World Topography Map": Esri_WorldTopoMap,
    "Satelit": Esri_WorldImagery,
    "Relief": Esri_WorldShadedRelief
};

var overlayMaps = {
    "Batas Provinsi Jakarta": batas
};

// Tambahkan ikon Layer Control di dalam peta
L.control.layers(baseMaps, overlayMaps, { collapsed: true }).addTo(map);
