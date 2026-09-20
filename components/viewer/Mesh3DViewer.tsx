'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import useSWR from 'swr';
import { fetcher } from '@/lib/api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { CaseDTO } from '@/types/case';

interface MeshPayload {
  vertices: [number, number, number][];
  faces: [number, number, number][];
}

interface Mesh3DResponse {
  shape: [number, number, number]; // [axial, coronal, sagittal]
  brain: MeshPayload | null;
  tumor: MeshPayload | null;
}

/** Bangun BufferGeometry dari mesh backend (vertices/faces sumbu Z,Y,X = axial,coronal,sagittal,
 * lihat ai/mesh.py), dipusatkan & dinormalisasi ke skala seragam supaya pas di layar berapapun
 * ukuran volumenya. */
function buildGeometry(mesh: MeshPayload, shape: [number, number, number]): THREE.BufferGeometry {
  const scale = 1 / Math.max(...shape);
  const positions = new Float32Array(mesh.vertices.length * 3);
  mesh.vertices.forEach(([z, y, x], i) => {
    positions[i * 3] = (x - shape[2] / 2) * scale;
    positions[i * 3 + 1] = (shape[0] / 2 - z) * scale; // axial dibalik supaya "atas" tampil ke atas
    positions[i * 3 + 2] = (y - shape[1] / 2) * scale;
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(mesh.faces.flat());
  geometry.computeVertexNormals();
  return geometry;
}

function Scene({ data }: { data: Mesh3DResponse }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 100);
    camera.position.set(0, 0, 2.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);

    const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

    if (data.brain) {
      const geometry = buildGeometry(data.brain, data.shape);
      const material = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      scene.add(new THREE.Mesh(geometry, material));
      disposables.push(geometry, material);
    }

    if (data.tumor) {
      const geometry = buildGeometry(data.tumor, data.shape);
      const material = new THREE.MeshStandardMaterial({ color: 0xef4444, opacity: 0.95, transparent: true });
      scene.add(new THREE.Mesh(geometry, material));
      disposables.push(geometry, material);
    }

    let frame = requestAnimationFrame(function loop() {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!container.clientWidth || !container.clientHeight) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      disposables.forEach((d) => d.dispose());
      container.removeChild(renderer.domElement);
    };
  }, [data]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export function Mesh3DViewer({ activeCase }: { activeCase: CaseDTO }) {
  const { data, error } = useSWR<Mesh3DResponse>(`/api/cases/${activeCase.id}/volume/mesh3d`, fetcher, {
    revalidateOnFocus: false,
  });
  // ponytail: cuma jalan selagi request mesh3d di atas belum selesai (key jadi null kalau
  // sudah ada `data`) -- baca progres riil dari _mesh_progress backend, bukan estimasi waktu.
  const { data: progress } = useSWR<{ done: number; total: number }>(
    !data && !error ? `/api/cases/${activeCase.id}/volume/mesh3d/progress` : null,
    fetcher,
    { refreshInterval: 800, revalidateOnFocus: false }
  );

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-slate-500">
        Gagal memuat mesh 3D.
      </div>
    );
  }
  if (!data) {
    const hasProgress = !!progress && progress.total > 0;
    const pct = hasProgress ? Math.round((progress!.done / progress!.total) * 100) : null;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <LoadingSpinner
          label={
            hasProgress
              ? `Menyegmentasi slice ${progress!.done}/${progress!.total}…`
              : 'Membangun mesh 3D (segmentasi seluruh slice)…'
          }
        />
        {pct !== null && (
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-theater-800">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    );
  }
  if (!data.brain && !data.tumor) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-slate-500">
        Tidak ada permukaan yang bisa dirender untuk volume ini.
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 bg-theater-950">
      <Scene data={data} />
      <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-slate-500">
        Seret untuk putar &middot; scroll untuk zoom
      </div>
    </div>
  );
}
