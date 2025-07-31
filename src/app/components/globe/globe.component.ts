import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  NgZone,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ThreeGlobe from 'three-globe';
import * as d3 from 'd3';
import { CommonModule } from '@angular/common';

interface CountryData {
  lat: number;
  lng: number;
  intensity: number;
  name: string;
}

interface EventData {
  lat: number;
  lng: number;
  size: number;
  color: string;
  name: string;
}

interface LabelData {
  lat: number;
  lng: number;
  text: string;
  size: number;
  color: string;
}

interface GeoCoords {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-globe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.scss'],
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('globeContainer', { static: true })
  globeContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) tooltip!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private globe!: any;
  private animationFrameId!: number;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isMobile = window.innerWidth <= 768;
  private isDragging = false;
  private lastTouchDistance = 0;

  private countries: CountryData[] = [
    { lat: 48.3794, lng: 31.1656, intensity: 0.9, name: 'Ukraine' },
    { lat: 51.9194, lng: 19.1451, intensity: 0.7, name: 'Poland' },
    { lat: 47.1625, lng: 19.5033, intensity: 0.6, name: 'Hungary' },
    { lat: 46.8182, lng: 8.2275, intensity: 0.5, name: 'Switzerland' },
    { lat: 61.524, lng: 105.3188, intensity: 0.8, name: 'Russia' },
    { lat: 39.9042, lng: 116.4074, intensity: 0.7, name: 'China' },
    { lat: 40.4637, lng: -3.7492, intensity: 0.6, name: 'Spain' },
    { lat: 23.6345, lng: -102.5528, intensity: 0.5, name: 'Mexico' },
    { lat: 37.0902, lng: -95.7129, intensity: 0.9, name: 'United States' },
    { lat: 56.1304, lng: -106.3468, intensity: 0.4, name: 'Canada' },
    { lat: -25.2744, lng: 133.7751, intensity: 0.5, name: 'Australia' },
    { lat: 22.3193, lng: 114.1694, intensity: 0.7, name: 'Hong Kong' },
    { lat: 35.9078, lng: 127.7669, intensity: 0.8, name: 'South Korea' },
    { lat: 36.2048, lng: 138.2529, intensity: 0.6, name: 'Japan' },
    { lat: 20.5937, lng: 78.9629, intensity: 0.7, name: 'India' },
    { lat: -0.7893, lng: 113.9213, intensity: 0.5, name: 'Indonesia' },
    { lat: -14.235, lng: -51.9253, intensity: 0.6, name: 'Brazil' },
    { lat: -38.4161, lng: -63.6167, intensity: 0.4, name: 'Argentina' },
  ];

  private events: EventData[] = [
    { lat: 50.4501, lng: 30.5234, size: 0.3, color: 'red', name: 'Kyiv' },
    { lat: 49.9935, lng: 36.2304, size: 0.25, color: 'red', name: 'Kharkiv' },
    { lat: 48.0159, lng: 37.8028, size: 0.2, color: 'red', name: 'Donetsk' },
    { lat: 47.0951, lng: 37.5413, size: 0.2, color: 'red', name: 'Mariupol' },
    { lat: 51.5074, lng: -0.1278, size: 0.15, color: 'yellow', name: 'London' },
    {
      lat: 40.7128,
      lng: -74.006,
      size: 0.2,
      color: 'yellow',
      name: 'New York',
    },
    { lat: 48.8566, lng: 2.3522, size: 0.15, color: 'yellow', name: 'Paris' },
    { lat: 52.52, lng: 13.405, size: 0.15, color: 'yellow', name: 'Berlin' },
    { lat: 55.7558, lng: 37.6173, size: 0.2, color: 'orange', name: 'Moscow' },
    {
      lat: 39.9042,
      lng: 116.4074,
      size: 0.2,
      color: 'orange',
      name: 'Beijing',
    },
  ];

  private labels: LabelData[] = [
    { lat: 50.4501, lng: 30.5234, text: 'KYIV', size: 1.0, color: '#ff7eee' },
    { lat: 51.5074, lng: -0.1278, text: 'LONDON', size: 0.8, color: '#a0a0ff' },
    {
      lat: 40.7128,
      lng: -74.006,
      text: 'NEW YORK',
      size: 0.8,
      color: '#a0a0ff',
    },
    { lat: 55.7558, lng: 37.6173, text: 'MOSCOW', size: 0.8, color: '#ff9e7e' },
  ];

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.initGlobe();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
  }

  private initGlobe() {
    // Create ThreeJS scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a081e);

    // Adjust camera for mobile
    const fov = this.isMobile ? 75 : 60;
    this.camera = new THREE.PerspectiveCamera(
      fov,
      this.globeContainer.nativeElement.clientWidth /
        this.globeContainer.nativeElement.clientHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    // Set pixel ratio for mobile optimization
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(
      this.globeContainer.nativeElement.clientWidth,
      this.globeContainer.nativeElement.clientHeight
    );
    this.globeContainer.nativeElement.appendChild(this.renderer.domElement);

    // Create the globe
    this.globe = new ThreeGlobe()
      .globeImageUrl(
        '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
      )
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('#a0a0ff')
      .atmosphereAltitude(0.15);

    // Add to scene
    this.scene.add(this.globe);
    this.scene.add(new THREE.AmbientLight(0xcccccc, 0.8));
    this.scene.add(new THREE.DirectionalLight(0xffffff, 0.3));

    // Position camera
    this.camera.position.z = this.isMobile ? 350 : 300;

    // Add orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.autoRotate = !this.isMobile;
    this.controls.autoRotateSpeed = 0.8;
    this.controls.enableZoom = true;
    this.controls.minDistance = 200;
    this.controls.maxDistance = 500;

    // Add heatmap data
    const pointResolution = this.isMobile ? 6 : 8;

    this.globe
      .pointsData(this.countries)
      .pointLat((d: CountryData) => d.lat)
      .pointLng((d: CountryData) => d.lng)
      .pointColor((d: CountryData) => {
        const colorScale = d3
          .scaleSequential(d3.interpolatePlasma)
          .domain([0, 1]);
        return colorScale(d.intensity);
      })
      .pointAltitude(0.01)
      .pointRadius(
        (d: CountryData) => d.intensity * (this.isMobile ? 0.2 : 0.3)
      )
      .pointResolution(pointResolution);

    // Add event points
    this.globe
      .pointsData(this.events)
      .pointColor((d: EventData) => d.color)
      .pointAltitude(0.01)
      .pointRadius((d: EventData) => d.size * (this.isMobile ? 0.8 : 1))
      .pointResolution(pointResolution);

    // Add labels with larger text on mobile
    this.globe
      .labelsData(this.labels)
      .labelText((d: LabelData) => d.text)
      .labelSize((d: LabelData) => d.size * (this.isMobile ? 1.2 : 1))
      .labelColor((d: LabelData) => d.color)
      .labelDotRadius(0.3)
      .labelDotOrientation(() => 'bottom');

    // Animation loop
    this.animate();
  }

  private onWindowResize = () => {
    this.isMobile = window.innerWidth <= 768;

    this.camera.aspect =
      this.globeContainer.nativeElement.clientWidth /
      this.globeContainer.nativeElement.clientHeight;
    this.camera.fov = this.isMobile ? 75 : 60;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      this.globeContainer.nativeElement.clientWidth,
      this.globeContainer.nativeElement.clientHeight
    );
  };

  private setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize);

    const canvas = this.renderer.domElement;

    // Mouse/Touch events
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerdown', () => (this.isDragging = false));
    canvas.addEventListener('pointerup', () => (this.isDragging = false));

    // Touch events for pinch-to-zoom
    canvas.addEventListener('touchstart', this.handleTouchStart);
    canvas.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });

    // Hide tooltip when not hovering
    canvas.addEventListener('pointerleave', () => {
      this.tooltip.nativeElement.style.opacity = '0';
    });
  }

  private handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 2) {
      this.lastTouchDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
    }
  };

  private handleTouchMove = (event: TouchEvent) => {
    // Handle pinch-to-zoom
    if (event.touches.length === 2) {
      event.preventDefault();

      const distance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );

      const zoomDelta = (distance - this.lastTouchDistance) * 0.01;
      this.camera.position.z -= zoomDelta * 10;
      this.lastTouchDistance = distance;
    }
    // Handle single touch for tooltip
    else if (event.touches.length === 1) {
      this.onPointerMove(event);
    }
  };

  private onPointerMove = (event: MouseEvent | TouchEvent) => {
    event.stopPropagation();

    // Skip tooltip while dragging
    if ((event as MouseEvent).buttons === 1) {
      this.isDragging = true;
      this.tooltip.nativeElement.style.opacity = '0';
      return;
    }

    if (this.isDragging) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    let clientX, clientY;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.globe);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const latLng: GeoCoords = this.globe.toGeoCoords(point);

      // Find closest country
      let closestCountry: CountryData | null = null;
      let minDist = Infinity;

      this.countries.forEach((country) => {
        const dist = Math.sqrt(
          Math.pow(country.lat - latLng.lat, 2) +
            Math.pow(country.lng - latLng.lng, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestCountry = country;
        }
      });

      if (closestCountry && minDist < 5) {
        this.tooltip.nativeElement.style.opacity = '1';
        this.tooltip.nativeElement.style.left = `${clientX + 15}px`;
        this.tooltip.nativeElement.style.top = `${clientY + 15}px`;

        const country = closestCountry as CountryData;
        const intensity = country.intensity;
        let status: string;
        if (intensity > 0.8) status = 'CRITICAL ACTIVITY';
        else if (intensity > 0.6) status = 'HIGH ACTIVITY';
        else if (intensity > 0.4) status = 'MODERATE ACTIVITY';
        else status = 'LOW ACTIVITY';

        this.tooltip.nativeElement.innerHTML = `
          <div class="tooltip-title">${country.name}</div>
          <div class="tooltip-content">
            <div>Status: <strong>${status}</strong></div>
            <div>Tracking ${Math.floor(intensity * 150)} events</div>
            <div>Last update: 15 min ago</div>
          </div>
        `;
        return;
      }
    }

    this.tooltip.nativeElement.style.opacity = '0';
  };

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }
}
