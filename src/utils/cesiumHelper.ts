/**
 * @file cesiumHelper.ts
 * @description Cesium 三维数字地球控制器（数据驱动空间包络计算、正俯瞰居中无下沉视角、细粒度实体-要素图层联动、雷达扫描锥与战区包络）
 */

import * as Cesium from 'cesium'
import type { SituationTarget, SpatialRelation, SituationRegion, BattlefieldEnvironment, TemporalPhase, SituationEvent } from '@/types/situation'
import { useSceneStore } from '@/stores/sceneStore'
import { useSituationStore } from '@/stores/situationStore'
import { generateAttackArrowPoints } from '@/utils/militaryPlotting'
import type { WorkContent } from '@/types/scene'

export type BasemapType = 'satellite' | 'dark' | 'street' | 'hillshade' | 'imagery_anno'

interface RadarVisualSet {
  base: Cesium.Entity
  notch: Cesium.Entity
  projection: Cesium.Entity
  sweep: Cesium.Entity
  nearTrail: Cesium.Entity
  farTrail: Cesium.Entity
  sweepArc: Cesium.Entity
}

interface JammingVisualSet {
  cone: Cesium.Entity
  beam: Cesium.Entity
  label: Cesium.Entity
}

interface RangeTransition {
  from: number
  to: number
  startedAt: number
}

export class CesiumController {
  public viewer: Cesium.Viewer | null = null
  private entityMap: Map<string, Cesium.Entity> = new Map()
  private trackEntities: Map<string, Cesium.Entity> = new Map()
  private relationEntities: Map<string, Cesium.Entity> = new Map()
  private relationLabels: Map<string, Cesium.Entity> = new Map()
  private regionEntities: Map<string, Cesium.Entity> = new Map()
  private regionLabels: Map<string, Cesium.Entity> = new Map()
  private radarConeEntities: Map<string, Cesium.Entity> = new Map()
  private radarVisualSets: Map<string, RadarVisualSet> = new Map()
  private jammingVisualSets: Map<string, JammingVisualSet> = new Map()
  private radarVisibility: Map<string, boolean> = new Map()
  private radarRangeTransitions: Map<string, RangeTransition> = new Map()
  private latestTargets: Map<string, SituationTarget> = new Map()
  private radarAnimationSeconds = 0
  private removeRadarClockListener: (() => void) | null = null
  private futureTrackEntities: Map<string, Cesium.Entity> = new Map()
  private futureBranchEntities: Map<string, Cesium.Entity> = new Map()
  private temporalSliceEntities: Map<string, Cesium.Entity> = new Map()
  private measureEntities: Cesium.Entity[] = []
  private eventEntities: Map<string, Cesium.Entity> = new Map()
  private eventLinkEntities: Map<string, Cesium.Entity> = new Map()
  private plotEntities: Map<string, Cesium.Entity> = new Map()
  private clusterEntities: Map<string, Cesium.Entity> = new Map()
  private highlightEntities: Map<string, Cesium.Entity> = new Map()
  private analysisOverlayEntities: Map<string, Cesium.Entity> = new Map()

  private activeHandler: Cesium.ScreenSpaceEventHandler | null = null
  private currentBasemap: BasemapType = 'satellite'
  public interactionMode: 'idle' | 'construct' | 'search-rect' | 'measure' = 'idle'
  private clusteredTargetIds: Set<string> = new Set()
  private diamondImageCache: Record<string, string> = {}

  /** 初始化 Cesium 视窗 */
  public init(containerId: string): Cesium.Viewer {
    Cesium.Ion.defaultAccessToken = ''

    this.viewer = new Cesium.Viewer(containerId, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      vrButton: false,
      scene3DOnly: true,
      shadows: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider()
    })

    const radarEpoch = Cesium.JulianDate.clone(this.viewer.clock.currentTime)
    this.removeRadarClockListener = this.viewer.clock.onTick.addEventListener((clock) => {
      this.radarAnimationSeconds = Math.max(0, Cesium.JulianDate.secondsDifference(clock.currentTime, radarEpoch))
      this.radarVisualSets.forEach((_set, targetId) => this.refreshRadarVisualVisibility(targetId))
      this.refreshJammingVisualVisibility()
      if (this.radarVisualSets.size || this.jammingVisualSets.size) {
        this.viewer?.scene.requestRender()
      }
    })

    // 彻底隐藏 Cesium 原生版权与 Logo 标识
    if (this.viewer.cesiumWidget && this.viewer.cesiumWidget.creditContainer) {
      (this.viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'
    }
    if (this.viewer.creditDisplay && this.viewer.creditDisplay.container) {
      this.viewer.creditDisplay.container.style.display = 'none'
    }

    const scene = this.viewer.scene
    const globe = scene.globe

    // 视觉、大气层与雾效优化
    globe.baseColor = Cesium.Color.fromCssColorString('#0b1424')
    scene.backgroundColor = Cesium.Color.fromCssColorString('#040811')
    if (scene.sun) scene.sun.show = true
    if (scene.moon) scene.moon.show = true
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true
      scene.skyAtmosphere.brightnessShift = 0.15
    }
    scene.fog.enabled = true
    scene.fog.density = 0.0001
    globe.enableLighting = false
    globe.depthTestAgainstTerrain = false

    // 相机控制器缩放及平移优化
    const controller = scene.screenSpaceCameraController
    controller.maximumZoomDistance = 35000000.0
    controller.minimumZoomDistance = 200.0
    controller.enableCollisionDetection = false

    // 默认加载遥感卫星底图
    this.setBasemap('satellite')

    // 默认以正俯瞰垂直居中全貌视角初始化 (高度 14500公里，Pitch -89.9°，球体居中且不沉底)
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(116.0, 26.0, 14500000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-89.9),
        roll: 0.0
      }
    })

    return this.viewer
  }

  /** 切换底图模式 (默认遥感卫星影像) */
  public setBasemap(type: BasemapType) {
    if (!this.viewer) return
    this.currentBasemap = type
    const layers = this.viewer.imageryLayers
    layers.removeAll()

    try {
      if (type === 'satellite') {
        const provider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19
        })
        const layer = layers.addImageryProvider(provider)
        layer.brightness = 1.05
        layer.contrast = 1.1
      } else if (type === 'dark') {
        const provider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          subdomains: ['a', 'b', 'c', 'd'],
          maximumLevel: 19
        })
        const layer = layers.addImageryProvider(provider)
        layer.alpha = 0.95
        layer.brightness = 0.85
      } else if (type === 'street') {
        const provider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: ['a', 'b', 'c'],
          maximumLevel: 19
        })
        layers.addImageryProvider(provider)
      } else if (type === 'hillshade') {
        const provider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 16
        })
        layers.addImageryProvider(provider)
      } else if (type === 'imagery_anno') {
        const imagery = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19
        })
        const anno = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 16
        })
        layers.addImageryProvider(imagery)
        layers.addImageryProvider(anno)
      }
    } catch (e) {
      console.warn('底图加载异常', e)
    }
  }

  // ===================== 空间量测工具箱实现 =====================

  public startMeasureDistance(onCompleted?: (distanceKm: number) => void) {
    if (!this.viewer) return
    this.clearActiveHandler()

    const positions: Cesium.Cartesian3[] = []
    const dynamicPositions = new Cesium.CallbackProperty(() => positions, false)
    const lineEntity = this.viewer.entities.add({
      polyline: {
        positions: dynamicPositions,
        width: 3,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString('#00ffff'),
          dashLength: 12
        }),
        clampToGround: true
      }
    })
    this.measureEntities.push(lineEntity)

    this.activeHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)

    this.activeHandler.setInputAction((click: any) => {
      const cartesian = this.viewer!.scene.pickPosition(click.position) ||
        this.viewer!.camera.pickEllipsoid(click.position, this.viewer!.scene.globe.ellipsoid)

      if (cartesian) {
        positions.push(cartesian)
        const pointEntity = this.viewer!.entities.add({
          position: cartesian,
          point: {
            pixelSize: 10,
            color: Cesium.Color.fromCssColorString('#00ffff'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        })
        this.measureEntities.push(pointEntity)

        if (positions.length >= 2) {
          const c1 = Cesium.Cartographic.fromCartesian(positions[0])
          const c2 = Cesium.Cartographic.fromCartesian(positions[positions.length - 1])
          const geodesic = new Cesium.EllipsoidGeodesic(c1, c2)
          const distanceMeters = geodesic.surfaceDistance
          const distanceKm = distanceMeters / 1000

          const midCartesian = Cesium.Cartesian3.midpoint(positions[0], positions[positions.length - 1], new Cesium.Cartesian3())
          const labelEntity = this.viewer!.entities.add({
            position: midCartesian,
            label: {
              text: `空间直线距离: ${distanceKm.toFixed(2)} 公里`,
              font: '14px sans-serif',
              fillColor: Cesium.Color.fromCssColorString('#00ffff'),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('rgba(8,16,28,0.9)'),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          })
          this.measureEntities.push(labelEntity)

          if (onCompleted) onCompleted(distanceKm)
          this.clearActiveHandler()
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  public startMeasureArea(onCompleted?: (areaSqKm: number) => void) {
    if (!this.viewer) return
    this.clearActiveHandler()

    const positions: Cesium.Cartesian3[] = []
    const polygonHierarchy = new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(positions), false)

    const polyEntity = this.viewer.entities.add({
      polygon: {
        hierarchy: polygonHierarchy,
        material: Cesium.Color.fromCssColorString('#faad14').withAlpha(0.35),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#faad14'),
        outlineWidth: 2
      }
    })
    this.measureEntities.push(polyEntity)

    this.activeHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)

    this.activeHandler.setInputAction((click: any) => {
      const cartesian = this.viewer!.scene.pickPosition(click.position) ||
        this.viewer!.camera.pickEllipsoid(click.position, this.viewer!.scene.globe.ellipsoid)

      if (cartesian) {
        positions.push(cartesian)
        const pt = this.viewer!.entities.add({
          position: cartesian,
          point: {
            pixelSize: 8,
            color: Cesium.Color.fromCssColorString('#faad14'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1.5,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        })
        this.measureEntities.push(pt)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.activeHandler.setInputAction(() => {
      if (positions.length >= 3) {
        const coords = positions.map((p) => {
          const carto = Cesium.Cartographic.fromCartesian(p)
          return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)]
        })

        let areaSqKm = 0
        for (let i = 0; i < coords.length; i++) {
          const j = (i + 1) % coords.length
          areaSqKm += coords[i][0] * coords[j][1] - coords[j][0] * coords[i][1]
        }
        areaSqKm = Math.abs(areaSqKm * 111 * 111 * 0.5)

        const centerCartesian = positions[0]
        const labelEntity = this.viewer!.entities.add({
          position: centerCartesian,
          label: {
            text: `多边形面积: ${areaSqKm.toFixed(1)} 平方公里`,
            font: '14px sans-serif',
            fillColor: Cesium.Color.fromCssColorString('#ffd666'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('rgba(8,16,28,0.9)'),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        })
        this.measureEntities.push(labelEntity)

        if (onCompleted) onCompleted(areaSqKm)
      }
      this.clearActiveHandler()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  public startTacticalPlot(
    onCompleted?: (geometry: { origin: [number, number]; polygon: Array<[number, number]> }) => void
  ) {
    if (!this.viewer) return
    this.clearActiveHandler()

    const points: Array<[number, number]> = []
    this.activeHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)

    this.activeHandler.setInputAction((click: any) => {
      const cartesian = this.viewer!.camera.pickEllipsoid(click.position, this.viewer!.scene.globe.ellipsoid)
      if (cartesian) {
        const carto = Cesium.Cartographic.fromCartesian(cartesian)
        points.push([Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)])

        if (points.length === 2) {
          const polygon = generateAttackArrowPoints(points[0], points[1])
          this.clearActiveHandler()
          if (onCompleted) onCompleted({ origin: points[0], polygon })
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  /** 清除分析上图覆盖层（热力/网格/分区） */
  public clearAnalysisOverlay() {
    if (!this.viewer) return
    this.analysisOverlayEntities.forEach((e) => this.viewer!.entities.remove(e))
    this.analysisOverlayEntities.clear()
  }

  /** 渲染已入库的标绘与标注工作内容（显隐受工作内容图层树控制，随增删自动同步） */
  public renderPlots(workContents: WorkContent[]) {
    if (!this.viewer) return
    const sceneStore = useSceneStore()
    const keep = new Set<string>()

    workContents.forEach((wc) => {
      if (wc.type !== 'tactical_arrow' && wc.type !== 'annotation') return
      keep.add(wc.id)
      const visible = sceneStore.isWorkItemVisible(wc.id)
      let entity = this.plotEntities.get(wc.id)
      if (!entity) {
        if (wc.type === 'tactical_arrow' && wc.payload?.geometry) {
          const hierarchy = new Cesium.PolygonHierarchy(
            (wc.payload.geometry as Array<[number, number]>).map((c) =>
              Cesium.Cartesian3.fromDegrees(c[0], c[1])
            )
          )
          entity = this.viewer!.entities.add({
            id: `PLOT_${wc.id}`,
            show: visible,
            polygon: {
              hierarchy,
              material: Cesium.Color.fromCssColorString('#ff4d4f').withAlpha(0.55),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#ff4d4f'),
              outlineWidth: 2.5
            }
          })
        } else if (wc.type === 'annotation' && wc.payload?.lon !== undefined) {
          const pos = Cesium.Cartesian3.fromDegrees(wc.payload.lon, wc.payload.lat, wc.payload.alt ?? 0)
          entity = this.viewer!.entities.add({
            id: `PLOT_${wc.id}`,
            show: visible,
            position: pos,
            point: {
              pixelSize: 10,
              color: Cesium.Color.fromCssColorString('#faad14'),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
              text: wc.payload.text || wc.label,
              font: '12px sans-serif',
              fillColor: Cesium.Color.fromCssColorString('#faad14'),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('rgba(8,16,28,0.9)'),
              pixelOffset: new Cesium.Cartesian2(0, -24),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          })
        }
        if (entity) this.plotEntities.set(wc.id, entity)
        return
      }
      entity.show = visible
    })

    // 清理已删除的标绘 / 标注
    this.plotEntities.forEach((entity, id) => {
      if (!keep.has(id)) {
        this.viewer!.entities.remove(entity)
        this.plotEntities.delete(id)
      }
    })
  }

  public clearMeasurements() {
    this.clearActiveHandler()
    if (!this.viewer) return
    this.measureEntities.forEach((e) => this.viewer!.entities.remove(e))
    this.measureEntities = []
  }

  private clearActiveHandler() {
    if (this.activeHandler) {
      this.activeHandler.destroy()
      this.activeHandler = null
    }
    if (this.interactionMode !== 'idle') this.interactionMode = 'idle'
  }

  // ===================== 态势要素与细粒度实体分类树联动渲染 =====================

  public renderTargets(
    targets: SituationTarget[],
    selectedId?: string
  ) {
    if (!this.viewer) return
    this.latestTargets = new Map(targets.map((target) => [target.id, target]))
    const sceneStore = useSceneStore()

    targets.forEach((target) => {
      let entity = this.entityMap.get(target.id)
      const isSelected = target.id === selectedId

      // 精确判定目标点位显隐
      let isPointVisible = false
      let isTrackVisible = false
      let isRadarVisible = false

      if (target.isHypothesis) {
        isPointVisible = sceneStore.isWorkItemVisible(target.id)
        isTrackVisible = isPointVisible
      } else {
        isPointVisible = sceneStore.isTargetVisible(target.id) && sceneStore.isFeatureVisible(target.id, 'position')
        isTrackVisible = sceneStore.isTargetVisible(target.id) && sceneStore.isFeatureVisible(target.id, 'track')
        isRadarVisible = sceneStore.isTargetVisible(target.id) && sceneStore.isFeatureVisible(target.id, 'radar')
      }

      const situationStore = useSituationStore()
      const isHighlighted = situationStore.highlightedTargetIds.includes(target.id)
      const shouldDim = situationStore.dimNonHighlighted && !isHighlighted && !target.isHypothesis
      const isClustered = this.clusteredTargetIds.has(target.id)

      const color = target.isHypothesis
        ? Cesium.Color.fromCssColorString('#b37feb')
        : target.affiliation === 'foe'
        ? Cesium.Color.fromCssColorString('#ff4d4f')
        : target.affiliation === 'friend'
        ? Cesium.Color.fromCssColorString('#00d2ff')
        : Cesium.Color.fromCssColorString('#faad14')

      const pos = Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, target.altitude)
      const altText = target.altitude >= 1000 ? `${(target.altitude / 1000).toFixed(1)}公里` : `${target.altitude}米`
      const pointVisible = isPointVisible && !isClustered
      const pixelSize = isHighlighted ? 20 : isSelected ? 18 : 12

      if (!entity) {
        entity = this.viewer!.entities.add({
          id: target.id,
          name: target.codeName,
          show: pointVisible,
          position: pos,
          point: {
            pixelSize,
            color: shouldDim ? color.withAlpha(0.28) : color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: isHighlighted ? 4 : isSelected ? 3.5 : 1.5,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: `【${target.codeName}】\n高度: ${altText} | 航速: ${target.speedKnots}节`,
            font: '13px sans-serif',
            fillColor: isSelected ? Cesium.Color.fromCssColorString('#00ffff') : Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -32),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('rgba(8,16,28,0.9)')
          }
        })
        this.entityMap.set(target.id, entity)
      } else {
        entity.show = pointVisible
        entity.position = new Cesium.ConstantPositionProperty(pos)
        if (entity.point) {
          entity.point.pixelSize = new Cesium.ConstantProperty(pixelSize)
          entity.point.color = new Cesium.ConstantProperty(shouldDim ? color.withAlpha(0.28) : color)
          entity.point.outlineWidth = new Cesium.ConstantProperty(isHighlighted ? 4 : isSelected ? 3.5 : 1.5)
        }
        if (entity.label) {
          entity.label.text = new Cesium.ConstantProperty(
            `【${target.codeName}】\n高度: ${altText} | 航速: ${target.speedKnots}节`
          )
          entity.label.fillColor = new Cesium.ConstantProperty(
            isSelected ? Cesium.Color.fromCssColorString('#00ffff') : Cesium.Color.WHITE
          )
        }
      }

      this.renderTargetTrack(target, isTrackVisible && !shouldDim)
      this.renderSingleRadarCone(target, isRadarVisible && situationStore.showRadarCones && !shouldDim)
      this.syncHighlightRing(target, isHighlighted && pointVisible)
    })

    this.renderJammingEffects(targets)
    this.pruneStaleTargets(targets)
  }

  public updateTargetPositions(targets: SituationTarget[]) {
    if (!this.viewer) return
    this.latestTargets = new Map(targets.map((target) => [target.id, target]))
    targets.forEach((target) => {
      const entity = this.entityMap.get(target.id)
      const pos = Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, target.altitude)
      if (entity) entity.position = new Cesium.ConstantPositionProperty(pos)
      this.renderSingleRadarCone(target, this.radarVisibility.get(target.id) ?? false)
      const ring = this.highlightEntities.get(`HL_${target.id}`)
      if (ring) ring.position = new Cesium.ConstantPositionProperty(pos)
    })
    this.renderJammingEffects(targets)
  }

  /** 渲染单个目标的三维雷达覆盖、扫描亮楔、余辉与地面照射投影。 */
  private renderSingleRadarCone(target: SituationTarget, isVisible: boolean) {
    if (!this.viewer || !target.sensorCoverage) return
    this.radarVisibility.set(target.id, isVisible)
    this.syncRadarRangeTransition(target)
    this.ensureRadarVisualSet(target.id)
    this.refreshRadarVisualVisibility(target.id)
  }

  private ensureRadarVisualSet(targetId: string) {
    const existing = this.radarVisualSets.get(targetId)
    if (existing || !this.viewer) return existing

    const set: RadarVisualSet = {
      base: this.createRadarVolume(`RADAR_CONE_${targetId}`, targetId, 'base'),
      notch: this.createRadarVolume(`RADAR_CONE_NOTCH_${targetId}`, targetId, 'notch'),
      projection: this.createRadarProjection(`RADAR_PROJECTION_${targetId}`, targetId),
      sweep: this.createRadarVolume(`RADAR_SWEEP_${targetId}`, targetId, 'sweep'),
      nearTrail: this.createRadarVolume(`RADAR_TRAIL_NEAR_${targetId}`, targetId, 'nearTrail'),
      farTrail: this.createRadarVolume(`RADAR_TRAIL_FAR_${targetId}`, targetId, 'farTrail'),
      sweepArc: this.createRadarSweepArc(`RADAR_SWEEP_ARC_${targetId}`, targetId)
    }
    this.radarVisualSets.set(targetId, set)
    this.radarConeEntities.set(`RADAR_CONE_${targetId}`, set.base)
    return set
  }

  private createRadarVolume(
    id: string,
    targetId: string,
    layer: 'base' | 'notch' | 'sweep' | 'nearTrail' | 'farTrail'
  ) {
    return this.viewer!.entities.add({
      id,
      show: false,
      position: new Cesium.CallbackPositionProperty(() => this.targetPosition(targetId), false),
      orientation: new Cesium.CallbackProperty(() => this.radarOrientation(targetId), false),
      ellipsoid: {
        radii: new Cesium.CallbackProperty(() => this.radarRadii(targetId), false),
        minimumClock: new Cesium.CallbackProperty(() => this.radarClockWindow(targetId, layer)[0], false),
        maximumClock: new Cesium.CallbackProperty(() => this.radarClockWindow(targetId, layer)[1], false),
        minimumCone: new Cesium.ConstantProperty(0),
        maximumCone: new Cesium.CallbackProperty(() => this.radarMaximumCone(targetId), false),
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => this.radarMaterial(targetId, layer), false)
        ),
        outline: layer === 'base' || layer === 'notch',
        outlineColor: new Cesium.CallbackProperty(() => this.radarOutlineColor(targetId, layer), false),
        outlineWidth: layer === 'base' || layer === 'notch' ? 1.5 : 0
      }
    })
  }

  private createRadarProjection(id: string, targetId: string) {
    return this.viewer!.entities.add({
      id,
      show: false,
      position: new Cesium.CallbackPositionProperty(() => this.targetGroundPosition(targetId), false),
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(() => this.animatedRadarRangeMeters(targetId), false),
        semiMinorAxis: new Cesium.CallbackProperty(() => this.animatedRadarRangeMeters(targetId), false),
        rotation: new Cesium.CallbackProperty(() => {
          const target = this.latestTargets.get(targetId)
          return Cesium.Math.toRadians(target?.headingDeg || 0)
        }, false),
        material: new Cesium.StripeMaterialProperty({
          evenColor: new Cesium.CallbackProperty(() => this.radarColor(targetId).withAlpha(0.16), false),
          oddColor: Cesium.Color.TRANSPARENT,
          repeat: 18,
          orientation: Cesium.StripeOrientation.HORIZONTAL
        }),
        outline: true,
        outlineColor: new Cesium.CallbackProperty(() => this.radarColor(targetId).withAlpha(0.46), false),
        height: 0
      }
    })
  }

  private createRadarSweepArc(id: string, targetId: string) {
    return this.viewer!.entities.add({
      id,
      show: false,
      polyline: {
        positions: new Cesium.CallbackProperty(() => this.radarSweepArcPositions(targetId), false),
        width: 2.2,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: new Cesium.CallbackProperty(() => this.radarColor(targetId).withAlpha(0.92), false)
        }),
        clampToGround: false
      }
    })
  }

  private targetPosition(targetId: string) {
    const target = this.latestTargets.get(targetId)
    return target
      ? Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, target.altitude)
      : Cesium.Cartesian3.ZERO
  }

  private targetGroundPosition(targetId: string) {
    const target = this.latestTargets.get(targetId)
    return target
      ? Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, 0)
      : Cesium.Cartesian3.ZERO
  }

  private radarMount(target: SituationTarget) {
    const coverage = target.sensorCoverage!
    if (coverage.mountType) return coverage.mountType
    if (coverage.scanAngleDeg >= 340) return 'omni' as const
    return coverage.scanAngleDeg <= 40 ? 'firecontrol' as const : 'sector' as const
  }

  private radarSpanDeg(target: SituationTarget) {
    const mount = this.radarMount(target)
    if (mount === 'omni') return 360
    if (mount === 'firecontrol') return 16
    return Math.max(16, Math.min(180, target.sensorCoverage!.scanAngleDeg))
  }

  private radarElevationDeg(target: SituationTarget) {
    const configured = target.sensorCoverage!.elevationDeg
    if (configured != null) return configured
    const mount = this.radarMount(target)
    return mount === 'omni' ? 95 : mount === 'firecontrol' ? 12 : 35
  }

  private radarOrientation(targetId: string) {
    const target = this.latestTargets.get(targetId)
    if (!target?.sensorCoverage) return Cesium.Quaternion.IDENTITY
    const position = this.targetPosition(targetId)
    if (this.radarMount(target) === 'omni') {
      return Cesium.Transforms.headingPitchRollQuaternion(
        position,
        new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(target.headingDeg), 0, 0)
      )
    }
    return Cesium.Transforms.headingPitchRollQuaternion(
      position,
      new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(target.headingDeg), Cesium.Math.toRadians(-90), 0)
    )
  }

  private activeJammingProfile(target: SituationTarget) {
    const jamming = target.sensorCoverage?.jamming
    if (!jamming || !useSituationStore().isJammingActiveForTarget(target.id)) return null
    const jammer = jamming.jammerTargetIds
      .map((id) => this.latestTargets.get(id))
      .find((item): item is SituationTarget => !!item)
    if (!jammer) return null

    const distanceKm = Cesium.Cartesian3.distance(this.targetPosition(target.id), this.targetPosition(jammer.id)) / 1000
    // 进入有效探测距离后视为烧穿恢复，覆盖范围与缺口同步还原。
    if (distanceKm < jamming.effectiveRangeKm) return null
    return { jamming, jammer }
  }

  private syncRadarRangeTransition(target: SituationTarget) {
    const coverage = target.sensorCoverage
    if (!coverage) return
    const jamming = this.activeJammingProfile(target)?.jamming
    const targetRange = (jamming ? jamming.effectiveRangeKm : coverage.radarRangeKm) * 1000
    const current = this.radarRangeTransitions.get(target.id)
    if (!current) {
      this.radarRangeTransitions.set(target.id, { from: targetRange, to: targetRange, startedAt: performance.now() })
      return
    }
    if (Math.abs(current.to - targetRange) > 0.5) {
      const progress = Math.min(1, (performance.now() - current.startedAt) / 400)
      const from = current.from + (current.to - current.from) * progress
      this.radarRangeTransitions.set(target.id, { from, to: targetRange, startedAt: performance.now() })
    }
  }

  private animatedRadarRangeMeters(targetId: string) {
    const transition = this.radarRangeTransitions.get(targetId)
    if (!transition) return 0
    const progress = Math.min(1, (performance.now() - transition.startedAt) / 400)
    return transition.from + (transition.to - transition.from) * progress
  }

  private radarRadii(targetId: string) {
    const target = this.latestTargets.get(targetId)
    if (!target?.sensorCoverage) return Cesium.Cartesian3.ZERO
    const range = this.animatedRadarRangeMeters(targetId)
    const mount = this.radarMount(target)
    if (mount === 'sector') {
      return new Cesium.Cartesian3(range, range, range * Math.sin(Cesium.Math.toRadians(this.radarElevationDeg(target))))
    }
    return new Cesium.Cartesian3(range, range, range)
  }

  private radarMaximumCone(targetId: string) {
    const target = this.latestTargets.get(targetId)
    return target?.sensorCoverage ? Cesium.Math.toRadians(this.radarElevationDeg(target)) : 0
  }

  private radarColor(targetId: string) {
    const color = this.latestTargets.get(targetId)?.sensorCoverage?.coneColor || '#00d2ff'
    return Cesium.Color.fromCssColorString(color)
  }

  private radarMaterial(targetId: string, layer: 'base' | 'notch' | 'sweep' | 'nearTrail' | 'farTrail') {
    const target = this.latestTargets.get(targetId)
    const profile = target ? this.activeJammingProfile(target) : null
    const mount = target ? this.radarMount(target) : 'sector'
    const pulse = mount === 'firecontrol' && layer !== 'base' && layer !== 'notch'
      ? 0.06 + 0.08 * ((Math.sin(this.radarAnimationSeconds * Math.PI * 2) + 1) / 2)
      : 0
    const flicker = profile?.jamming.flicker
      ? 0.06 + 0.10 * ((Math.sin(this.radarAnimationSeconds * Math.PI * 4) + 1) / 2)
      : 0.11
    const alphaByLayer = {
      base: flicker,
      notch: flicker,
      sweep: 0.28 + pulse,
      nearTrail: 0.12,
      farTrail: 0.05
    }[layer]
    return this.radarColor(targetId).withAlpha(alphaByLayer)
  }

  private radarOutlineColor(targetId: string, layer: 'base' | 'notch' | 'sweep' | 'nearTrail' | 'farTrail') {
    return this.radarColor(targetId).withAlpha(layer === 'base' || layer === 'notch' ? 0.72 : 0)
  }

  private radarNotch(targetId: string) {
    const target = this.latestTargets.get(targetId)
    if (!target?.sensorCoverage) return null
    const profile = this.activeJammingProfile(target)
    if (!profile) return null

    const span = this.radarSpanDeg(target)
    const mount = this.radarMount(target)
    const bearing = this.bearingDegrees(target, profile.jammer)
    const originHeading = mount === 'omni' ? 0 : target.headingDeg - span / 2
    const relative = this.normalizeDegrees(bearing - originHeading)
    if (mount !== 'omni' && relative > span) return null
    const half = (profile.jamming.notchSpanDeg ?? 24) / 2
    return {
      start: Math.max(0, relative - half),
      end: Math.min(span, relative + half)
    }
  }

  private radarClockWindow(targetId: string, layer: 'base' | 'notch' | 'sweep' | 'nearTrail' | 'farTrail'): [number, number] {
    const target = this.latestTargets.get(targetId)
    if (!target?.sensorCoverage) return [0, 0]
    const span = this.radarSpanDeg(target)
    const notch = this.radarNotch(targetId)
    if (layer === 'base') {
      return [0, Cesium.Math.toRadians(notch ? notch.start : span)]
    }
    if (layer === 'notch') {
      return notch ? [Cesium.Math.toRadians(notch.end), Cesium.Math.toRadians(span)] : [0, 0]
    }
    return this.scanClockWindow(target, layer)
  }

  private scanClockWindow(target: SituationTarget, layer: 'sweep' | 'nearTrail' | 'farTrail'): [number, number] {
    const span = this.radarSpanDeg(target)
    const width = layer === 'sweep' ? 8 : layer === 'nearTrail' ? 30 : 60
    const period = Math.max(1, target.sensorCoverage?.scanPeriodSec ?? 4)
    const seed = Array.from(target.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360
    let sweepStart: number
    if (this.radarMount(target) === 'firecontrol') {
      sweepStart = Math.max(0, (span - 8) / 2)
    } else if (this.radarMount(target) === 'omni') {
      sweepStart = this.normalizeDegrees((this.radarAnimationSeconds / period) * 360 + seed)
    } else {
      const phase = ((this.radarAnimationSeconds / period) * Math.PI * 2 + Cesium.Math.toRadians(seed))
      sweepStart = ((Math.sin(phase) + 1) / 2) * Math.max(0, span - 8)
    }
    const trailingStart = Math.max(0, sweepStart - width)
    const trailingEnd = Math.min(span, sweepStart + (layer === 'sweep' ? 8 : 0))
    return [Cesium.Math.toRadians(layer === 'sweep' ? sweepStart : trailingStart), Cesium.Math.toRadians(trailingEnd)]
  }

  private isClockWindowVisible(targetId: string, layer: 'base' | 'notch' | 'sweep' | 'nearTrail' | 'farTrail') {
    const [start, end] = this.radarClockWindow(targetId, layer)
    if (end - start < Cesium.Math.toRadians(0.5)) return false
    if (layer === 'base' || layer === 'notch') return true
    const notch = this.radarNotch(targetId)
    if (!notch) return true
    const startDeg = Cesium.Math.toDegrees(start)
    const endDeg = Cesium.Math.toDegrees(end)
    return endDeg <= notch.start || startDeg >= notch.end
  }

  private refreshRadarVisualVisibility(targetId: string) {
    const target = this.latestTargets.get(targetId)
    const set = this.radarVisualSets.get(targetId)
    if (!target?.sensorCoverage || !set) return
    this.syncRadarRangeTransition(target)
    const visible = !!this.radarVisibility.get(targetId)
    const scanning = visible && target.sensorCoverage.isScanning !== false
    set.base.show = visible && this.isClockWindowVisible(targetId, 'base')
    set.notch.show = visible && this.isClockWindowVisible(targetId, 'notch')
    set.projection.show = visible
    set.sweep.show = scanning && this.isClockWindowVisible(targetId, 'sweep')
    set.nearTrail.show = scanning && this.isClockWindowVisible(targetId, 'nearTrail')
    set.farTrail.show = scanning && this.isClockWindowVisible(targetId, 'farTrail')
    set.sweepArc.show = scanning && this.isClockWindowVisible(targetId, 'sweep')
  }

  private radarSweepArcPositions(targetId: string) {
    const target = this.latestTargets.get(targetId)
    if (!target?.sensorCoverage || !this.isClockWindowVisible(targetId, 'sweep')) return []
    const [start, end] = this.radarClockWindow(targetId, 'sweep')
    const startDeg = Cesium.Math.toDegrees(start)
    const endDeg = Cesium.Math.toDegrees(end)
    const mount = this.radarMount(target)
    const originHeading = mount === 'omni' ? 0 : target.headingDeg - this.radarSpanDeg(target) / 2
    const range = this.animatedRadarRangeMeters(targetId)
    const points: Cesium.Cartesian3[] = []
    for (let index = 0; index <= 12; index++) {
      const ratio = index / 12
      const bearing = originHeading + startDeg + (endDeg - startDeg) * ratio
      points.push(this.destinationPosition(target, bearing, range, Math.max(1000, target.altitude + range * 0.08)))
    }
    return points
  }

  private renderJammingEffects(targets: SituationTarget[]) {
    if (!this.viewer) return
    this.latestTargets = new Map(targets.map((target) => [target.id, target]))
    const situationStore = useSituationStore()
    const sceneStore = useSceneStore()
    const layerVisible = sceneStore.isWorkItemVisible('WORK-JAMMING-EFFECT')
    const activeKeys = new Set<string>()
    situationStore.activeJammingPairs.forEach((pair) => {
      const jammer = this.latestTargets.get(pair.jammerTargetId)
      const jammed = this.latestTargets.get(pair.jammedTargetId)
      if (!jammer || !jammed) return
      const key = `${pair.jammerTargetId}__${pair.jammedTargetId}`
      activeKeys.add(key)
      const set = this.ensureJammingVisualSet(key, pair.jammerTargetId, pair.jammedTargetId)
      set.cone.show = layerVisible
      set.beam.show = layerVisible
      set.label.show = layerVisible
    })
    this.jammingVisualSets.forEach((set, key) => {
      if (!activeKeys.has(key)) {
        set.cone.show = false
        set.beam.show = false
        set.label.show = false
      }
    })
  }

  private ensureJammingVisualSet(key: string, jammerId: string, jammedId: string) {
    const existing = this.jammingVisualSets.get(key)
    if (existing || !this.viewer) return existing!
    const red = Cesium.Color.fromCssColorString('#ff4d4f')
    const set: JammingVisualSet = {
      cone: this.viewer.entities.add({
        id: `JAM_CONE_${key}`,
        show: false,
        position: new Cesium.CallbackPositionProperty(() => this.targetPosition(jammerId), false),
        orientation: new Cesium.CallbackProperty(() => this.orientationBetween(jammerId, jammedId), false),
        ellipsoid: {
          radii: new Cesium.CallbackProperty(() => {
            const jammer = this.latestTargets.get(jammerId)
            const jammed = this.latestTargets.get(jammedId)
            if (!jammer || !jammed) return Cesium.Cartesian3.ZERO
            const distance = Cesium.Cartesian3.distance(this.targetPosition(jammerId), this.targetPosition(jammedId))
            const radius = Math.max(40000, Math.min(180000, distance * 1.08))
            return new Cesium.Cartesian3(radius, radius, radius)
          }, false),
          minimumCone: 0,
          maximumCone: Cesium.Math.toRadians(14),
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty(
              () => red.withAlpha(0.08 + 0.08 * ((Math.sin(this.radarAnimationSeconds * Math.PI * 3) + 1) / 2)),
              false
            )
          ),
          outline: true,
          outlineColor: red.withAlpha(0.8),
          outlineWidth: 1.6
        }
      }),
      beam: this.viewer.entities.add({
        id: `JAM_BEAM_${key}`,
        show: false,
        polyline: {
          positions: new Cesium.CallbackProperty(
            () => [this.targetPosition(jammerId), this.targetPosition(jammedId)],
            false
          ),
          width: 3,
          material: new Cesium.PolylineDashMaterialProperty({
            color: new Cesium.CallbackProperty(
              () => red.withAlpha(0.65 + 0.3 * ((Math.sin(this.radarAnimationSeconds * Math.PI * 4) + 1) / 2)),
              false
            ),
            gapColor: Cesium.Color.TRANSPARENT,
            dashLength: 18
          })
        }
      }),
      label: this.viewer.entities.add({
        id: `JAM_LABEL_${key}`,
        show: false,
        position: new Cesium.CallbackPositionProperty(() => {
          return Cesium.Cartesian3.midpoint(this.targetPosition(jammerId), this.targetPosition(jammedId), new Cesium.Cartesian3())
        }, false),
        label: {
          text: '有源干扰',
          font: 'bold 12px sans-serif',
          fillColor: red,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
    }
    this.jammingVisualSets.set(key, set)
    return set
  }

  private refreshJammingVisualVisibility() {
    if (!this.viewer) return
    const sceneStore = useSceneStore()
    const activeKeys = new Set(
      useSituationStore().activeJammingPairs.map((pair) => `${pair.jammerTargetId}__${pair.jammedTargetId}`)
    )
    const layerVisible = sceneStore.isWorkItemVisible('WORK-JAMMING-EFFECT')
    this.jammingVisualSets.forEach((set, key) => {
      const visible = layerVisible && activeKeys.has(key)
      set.cone.show = visible
      set.beam.show = visible
      set.label.show = visible
    })
  }

  private orientationBetween(sourceId: string, targetId: string) {
    const source = this.latestTargets.get(sourceId)
    const target = this.latestTargets.get(targetId)
    if (!source || !target) return Cesium.Quaternion.IDENTITY
    return Cesium.Transforms.headingPitchRollQuaternion(
      this.targetPosition(sourceId),
      new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(this.bearingDegrees(source, target)), Cesium.Math.toRadians(-90), 0)
    )
  }

  private bearingDegrees(source: SituationTarget, target: SituationTarget) {
    const lat1 = Cesium.Math.toRadians(source.latitude)
    const lat2 = Cesium.Math.toRadians(target.latitude)
    const deltaLon = Cesium.Math.toRadians(target.longitude - source.longitude)
    const y = Math.sin(deltaLon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon)
    return this.normalizeDegrees(Cesium.Math.toDegrees(Math.atan2(y, x)))
  }

  private destinationPosition(target: SituationTarget, bearingDeg: number, distanceMeters: number, height: number) {
    const radius = 6378137
    const angularDistance = distanceMeters / radius
    const bearing = Cesium.Math.toRadians(bearingDeg)
    const lat1 = Cesium.Math.toRadians(target.latitude)
    const lon1 = Cesium.Math.toRadians(target.longitude)
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) + Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing))
    const lon2 = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    )
    return Cesium.Cartesian3.fromRadians(lon2, lat2, height)
  }

  private normalizeDegrees(value: number) {
    return ((value % 360) + 360) % 360
  }

  private renderTargetTrack(target: SituationTarget, isVisible = true) {
    if (!this.viewer || !target.tracks || target.tracks.length < 2) return

    const trackId = `TRACK_${target.id}`
    let trackEntity = this.trackEntities.get(trackId)

    const points = target.tracks.map((t) =>
      Cesium.Cartesian3.fromDegrees(t.longitude, t.latitude, t.altitude)
    )

    const lineColor = target.isHypothesis
      ? Cesium.Color.fromCssColorString('#b37feb')
      : target.affiliation === 'foe'
      ? Cesium.Color.fromCssColorString('#ff4d4f').withAlpha(0.85)
      : Cesium.Color.fromCssColorString('#00d2ff').withAlpha(0.85)

    if (!trackEntity) {
      trackEntity = this.viewer.entities.add({
        id: trackId,
        show: isVisible,
        polyline: {
          positions: points,
          width: target.isHypothesis ? 3.5 : 3,
          material: target.isHypothesis
            ? new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString('#b37feb'),
                dashLength: 16
              })
            : new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.25,
                color: lineColor
              }),
          clampToGround: false
        }
      })
      this.trackEntities.set(trackId, trackEntity)
    } else {
      trackEntity.show = isVisible
      if (trackEntity.polyline) {
        trackEntity.polyline.positions = new Cesium.ConstantProperty(points)
      }
    }
  }

  /**
   * 渲染实体间战术关系连线：
   * 严格要求：只有当连线关联的两端目标实体同时处于可见状态、且关联特性勾选激活时，连线才予以绘制显示！
   */
  public renderRelations(
    relations: SpatialRelation[],
    targets: SituationTarget[]
  ) {
    if (!this.viewer) return
    const sceneStore = useSceneStore()

    relations.forEach((rel) => {
      const src = targets.find((t) => t.id === rel.sourceTargetId)
      const dst = targets.find((t) => t.id === rel.targetTargetId)
      if (!src || !dst) return

      const relId = `REL_${rel.id}`
      const labelId = `REL_LABEL_${rel.id}`
      let relEntity = this.relationEntities.get(relId)
      let labelEntity = this.relationLabels.get(labelId)

      // 判断两端实体及其关系特性是否均处于可见状态 (同时受专题树"战术关系网络"分支开关控制)
      const isSrcVisible = sceneStore.isTargetVisible(rel.sourceTargetId) && sceneStore.isFeatureVisible(rel.sourceTargetId, 'relation')
      const isDstVisible = sceneStore.isTargetVisible(rel.targetTargetId) && sceneStore.isFeatureVisible(rel.targetTargetId, 'relation')
      const isRelVisible = isSrcVisible && isDstVisible && sceneStore.isRelationVisible(rel.id)

      const start = Cesium.Cartesian3.fromDegrees(src.longitude, src.latitude, src.altitude)
      const end = Cesium.Cartesian3.fromDegrees(dst.longitude, dst.latitude, dst.altitude)
      const mid = Cesium.Cartesian3.midpoint(start, end, new Cesium.Cartesian3())

      const color = rel.relationType === 'threat' || rel.relationType === 'strike'
        ? Cesium.Color.fromCssColorString('#ff4d4f')
        : rel.relationType === 'command'
        ? Cesium.Color.fromCssColorString('#faad14')
        : rel.relationType === 'escort'
        ? Cesium.Color.fromCssColorString('#b37feb')
        : Cesium.Color.fromCssColorString('#00d2ff')

      if (!relEntity) {
        relEntity = this.viewer!.entities.add({
          id: relId,
          show: isRelVisible,
          polyline: {
            positions: [start, end],
            width: rel.relationType === 'escort' ? 3 : 2,
            material: new Cesium.PolylineDashMaterialProperty({
              color: color.withAlpha(0.9),
              dashLength: 12
            }),
            clampToGround: false
          }
        })
        this.relationEntities.set(relId, relEntity)

        labelEntity = this.viewer!.entities.add({
          id: labelId,
          show: isRelVisible,
          position: mid,
          label: {
            text: `${rel.relationName} (${rel.spatialDistanceKm}km)`,
            font: '12px sans-serif',
            fillColor: color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('rgba(8,16,28,0.92)'),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        })
        this.relationLabels.set(labelId, labelEntity)
      } else {
        relEntity.show = isRelVisible
        if (relEntity.polyline) {
          relEntity.polyline.positions = new Cesium.ConstantProperty([start, end])
        }
        if (labelEntity) {
          labelEntity.show = isRelVisible
          labelEntity.position = new Cesium.ConstantPositionProperty(mid)
        }
      }
    })
  }

  /** 渲染态势区域多边形与战区含义标牌 */
  public renderRegions(regions: SituationRegion[]) {
    if (!this.viewer) return
    const sceneStore = useSceneStore()
    const thematicTier = sceneStore.contentLayers.find((l) => l.id === 'LAYER-THEMATIC')
    const layerOpacity = thematicTier ? (thematicTier.opacity || 75) / 100 : 0.75

    regions.forEach((region) => {
      let regEntity = this.regionEntities.get(region.id)
      let regLabelEntity = this.regionLabels.get(`LABEL_${region.id}`)

      const isRegionVisible = sceneStore.isRegionVisible(region.id)

      const hierarchy = region.coordinates.map((c) => Cesium.Cartesian3.fromDegrees(c[0], c[1]))
      const centerLon = region.coordinates.reduce((sum, c) => sum + c[0], 0) / region.coordinates.length
      const centerLat = region.coordinates.reduce((sum, c) => sum + c[1], 0) / region.coordinates.length
      const centerPos = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, region.minAltitude + 2000)

      if (!regEntity) {
        regEntity = this.viewer!.entities.add({
          id: region.id,
          name: region.name,
          show: isRegionVisible,
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(hierarchy),
            material: Cesium.Color.fromCssColorString(region.color).withAlpha(region.opacity * layerOpacity),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(region.color).withAlpha(0.85 * layerOpacity),
            outlineWidth: 2,
            height: region.minAltitude,
            extrudedHeight: region.maxAltitude > 0 ? region.maxAltitude : undefined
          }
        })
        this.regionEntities.set(region.id, regEntity)

        regLabelEntity = this.viewer!.entities.add({
          id: `LABEL_${region.id}`,
          show: isRegionVisible,
          position: centerPos,
          label: {
            text: region.name,
            font: '13px sans-serif',
            fillColor: Cesium.Color.fromCssColorString(region.color),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('rgba(8,16,28,0.9)'),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        })
        this.regionLabels.set(`LABEL_${region.id}`, regLabelEntity)
      } else {
        regEntity.show = isRegionVisible
        if (regEntity.polygon) {
          regEntity.polygon.material = new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString(region.color).withAlpha(region.opacity * layerOpacity)
          )
          regEntity.polygon.outlineColor = new Cesium.ConstantProperty(
            Cesium.Color.fromCssColorString(region.color).withAlpha(0.85 * layerOpacity)
          )
        }
        if (regLabelEntity) regLabelEntity.show = isRegionVisible
      }
    })
  }

  /** 战场气象与海洋水文环境渲染 */
  public renderEnvironment(env: BattlefieldEnvironment) {
    if (!this.viewer) return
    const scene = this.viewer.scene
    const sceneStore = useSceneStore()

    const isEnvVisible = sceneStore.isEnvironmentVisible('rain_fog')

    if (isEnvVisible && env.weatherType === 'rain_fog') {
      scene.fog.enabled = true
      scene.fog.density = 0.00035
      if (scene.skyAtmosphere) scene.skyAtmosphere.brightnessShift = -0.1
    } else {
      scene.fog.enabled = true
      scene.fog.density = 0.00008
      if (scene.skyAtmosphere) scene.skyAtmosphere.brightnessShift = 0.15
    }
  }

  // ===================== 【核心：纯数据驱动的空间包络与相机视角自适应算法】 =====================

  /**
   * 空间位置视角平滑跳转（严格采用正俯瞰 Top-Down 垂直视角，绝不沉底、不倾斜）
   */
  public flyToLocation(lon: number, lat: number, height = 750000, headingDeg = 0, pitchDeg = -89.9) {
    if (!this.viewer) return
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
      orientation: {
        heading: Cesium.Math.toRadians(headingDeg),
        pitch: Cesium.Math.toRadians(pitchDeg),
        roll: 0.0
      },
      duration: 1.2
    })
  }

  /**
   * 单一目标居中特写聚焦（数据驱动）：
   * 严格以适中战术全景高度 (650公里) 垂直俯瞰目标，目标位于视窗中心，绝不沉底！
   */
  public focusTarget(target: SituationTarget, viewHeight = 650000) {
    if (!this.viewer || !target) return
    this.flyToLocation(target.longitude, target.latitude, viewHeight, 0, -89.9)
  }

  /**
   * 纯数据驱动：根据坐标点集动态计算空间包络外接矩形 (Bounding Box) 与自适应视窗高度
   * 支持任意全球新增地区、多边形、航线，绝不硬编码经纬度！
   */
  public flyToCoordinates(
    coords: Array<[number, number] | { longitude: number; latitude: number }>,
    minHeight = 550000,
    maxHeight = 14500000
  ) {
    if (!this.viewer || !coords || coords.length === 0) return

    const points: Array<[number, number]> = coords.map((c) => {
      if (Array.isArray(c)) return [c[0], c[1]]
      return [c.longitude, c.latitude]
    })

    let minLon = Number.POSITIVE_INFINITY
    let maxLon = Number.NEGATIVE_INFINITY
    let minLat = Number.POSITIVE_INFINITY
    let maxLat = Number.NEGATIVE_INFINITY

    for (const [lon, lat] of points) {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }

    const centerLon = (minLon + maxLon) / 2
    const centerLat = (minLat + maxLat) / 2

    const lonSpan = Math.abs(maxLon - minLon)
    const latSpan = Math.abs(maxLat - minLat)
    const maxSpanDeg = Math.max(lonSpan, latSpan)

    // 数据驱动推导相机高度：根据球面经纬跨度乘视野系数，自适应匹配最佳俯瞰高度
    let calculatedHeight = minHeight
    if (maxSpanDeg > 0.05) {
      calculatedHeight = maxSpanDeg * 111000 * 1.8
      calculatedHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight))
    }

    this.flyToLocation(centerLon, centerLat, calculatedHeight, 0, -89.9)
  }

  /**
   * 渲染未来外推预测光轨（激光流动紫/橙色光带 + 预期到达幽灵标记）
   */
  public renderFutureTracks(targets: SituationTarget[], isVisible = true) {
    if (!this.viewer) return
    const viewer = this.viewer
    const sceneStore = useSceneStore()

    targets.forEach((target) => {
      const futureId = `FUTURE_TRACK_${target.id}`
      const arrivalPointId = `FUTURE_ARRIVAL_${target.id}`

      let trackEntity = this.futureTrackEntities.get(futureId)
      let arrivalEntity = this.futureTrackEntities.get(arrivalPointId)

      const hasTracks = target.predictedTracks && target.predictedTracks.length >= 2
      const isTargetShow = isVisible && sceneStore.isTargetVisible(target.id) && hasTracks

      if (!isTargetShow) {
        if (trackEntity) trackEntity.show = false
        if (arrivalEntity) arrivalEntity.show = false
        return
      }

      const points = target.predictedTracks!.map((t) =>
        Cesium.Cartesian3.fromDegrees(t.longitude, t.latitude, t.altitude)
      )

      const lastPoint = target.predictedTracks![target.predictedTracks!.length - 1]
      const lastPos = Cesium.Cartesian3.fromDegrees(lastPoint.longitude, lastPoint.latitude, lastPoint.altitude)

      const color = target.affiliation === 'foe'
        ? Cesium.Color.fromCssColorString('#b37feb')
        : Cesium.Color.fromCssColorString('#faad14')

      if (!trackEntity) {
        trackEntity = viewer.entities.add({
          id: futureId,
          show: true,
          polyline: {
            positions: points,
            width: 4,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.35,
              color: color
            }),
            clampToGround: false
          }
        })
        this.futureTrackEntities.set(futureId, trackEntity)
      } else {
        trackEntity.show = true
        if (trackEntity.polyline) {
          trackEntity.polyline.positions = new Cesium.ConstantProperty(points)
        }
      }

      // 未来预测预期交汇到达点幽灵标记 (Ghost Marker)
      if (!arrivalEntity) {
        arrivalEntity = viewer.entities.add({
          id: arrivalPointId,
          show: true,
          position: lastPos,
          point: {
            pixelSize: 10,
            color: color.withAlpha(0.9),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: `🔮【未来预测外推点】\n${target.codeName} (${lastPoint.timestamp.slice(11)})\n高度: ${lastPoint.altitude}m | 航速: ${lastPoint.speedKnots}节`,
            font: '12px sans-serif',
            fillColor: Cesium.Color.fromCssColorString('#d3adf7'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -28),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('rgba(14,20,38,0.92)'),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        })
        this.futureTrackEntities.set(arrivalPointId, arrivalEntity)
      } else {
        arrivalEntity.show = true
        arrivalEntity.position = new Cesium.ConstantPositionProperty(lastPos)
      }
    })
  }

  /**
   * 渲染未来多分支战术推演假说比对 (彩色发光虚线 + 概率气泡)
   */
  public renderFutureBranches(targets: SituationTarget[], isVisible = true, selectedBranchId?: string) {
    if (!this.viewer) return
    const sceneStore = useSceneStore()

    targets.forEach((target) => {
      if (!target.futureBranches || target.futureBranches.length === 0) return

      target.futureBranches.forEach((branch) => {
        const branchLineId = `BRANCH_LINE_${branch.branchId}`
        const branchBadgeId = `BRANCH_BADGE_${branch.branchId}`

        let lineEntity = this.futureBranchEntities.get(branchLineId)
        let badgeEntity = this.futureBranchEntities.get(branchBadgeId)

        const isBranchShow = isVisible && sceneStore.isTargetVisible(target.id)

        if (!isBranchShow) {
          if (lineEntity) lineEntity.show = false
          if (badgeEntity) badgeEntity.show = false
          return
        }

        const points = branch.predictedTracks.map((t) =>
          Cesium.Cartesian3.fromDegrees(t.longitude, t.latitude, t.altitude)
        )

        const midPoint = branch.predictedTracks[Math.floor(branch.predictedTracks.length / 2)]
        const midPos = Cesium.Cartesian3.fromDegrees(midPoint.longitude, midPoint.latitude, midPoint.altitude)

        const color = Cesium.Color.fromCssColorString(branch.color)

        if (!lineEntity) {
          lineEntity = this.viewer!.entities.add({
            id: branchLineId,
            show: true,
            polyline: {
              positions: points,
              width: 3.5,
              material: new Cesium.PolylineDashMaterialProperty({
                color: color,
                dashLength: 14
              }),
              clampToGround: false
            }
          })
          this.futureBranchEntities.set(branchLineId, lineEntity)
        } else {
          lineEntity.show = true
          if (lineEntity.polyline) {
            lineEntity.polyline.positions = new Cesium.ConstantProperty(points)
          }
        }

        if (!badgeEntity) {
          badgeEntity = this.viewer!.entities.add({
            id: branchBadgeId,
            show: true,
            position: midPos,
            label: {
              text: `${branch.name} (置信概率: ${branch.probability}%)\n${branch.tacticalIntent}`,
              font: '12px sans-serif',
              fillColor: color,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('rgba(10,18,32,0.92)'),
              pixelOffset: new Cesium.Cartesian2(0, -22),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          })
          this.futureBranchEntities.set(branchBadgeId, badgeEntity)
        } else {
          badgeEntity.show = true
          badgeEntity.position = new Cesium.ConstantPositionProperty(midPos)
        }
      })
    })
  }

  /**
   * 渲染历史-当前-未来三态时空切片图层 (历史/现在/未来三个时间切面可独立显隐)
   * 视觉层级：选中切片 (全量标牌+大点) > 时间轴当前相位切片 (单行标牌+中点) > 其他相位 (淡化小点)
   */
  public renderTemporalSlices(
    targets: SituationTarget[],
    options: {
      visible: boolean
      layers: Record<TemporalPhase, boolean>
      activeSliceKey: { targetId: string; index: number } | null
      activePhase: TemporalPhase
    }
  ) {
    if (!this.viewer) return
    const sceneStore = useSceneStore()

    targets.forEach((target) => {
      if (!target.temporalSlices || target.temporalSlices.length === 0) return
      const slices = target.temporalSlices
      const isTargetShow = options.visible && sceneStore.isTargetVisible(target.id)

      // 1. 趋势连线：历史青色流光带 (历史→当前) 与未来紫色虚线 (当前→未来)，随各自图层开关显隐
      const histPoints = slices
        .filter((s) => s.phase === 'history' || s.phase === 'present')
        .map((s) => Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, s.altitude))
      const futPoints = slices
        .filter((s) => s.phase === 'present' || s.phase === 'future')
        .map((s) => Cesium.Cartesian3.fromDegrees(s.longitude, s.latitude, s.altitude))

      this.upsertSliceFlowLine(`SLICE_FLOW_${target.id}_HIST`, isTargetShow && options.layers.history, histPoints, 'glow', '#00d2ff', 4)
      this.upsertSliceFlowLine(`SLICE_FLOW_${target.id}_FUT`, isTargetShow && options.layers.future, futPoints, 'dash', '#b37feb', 4.5)

      // 2. 每个切片的幽灵点位、高度垂线与瘦身标牌
      slices.forEach((slice, idx) => {
        const isActive = options.activeSliceKey?.targetId === target.id && options.activeSliceKey.index === idx
        const isCurrentPhase = slice.phase === options.activePhase
        const show = isTargetShow && options.layers[slice.phase]

        const airPos = Cesium.Cartesian3.fromDegrees(slice.longitude, slice.latitude, slice.altitude)
        const groundPos = Cesium.Cartesian3.fromDegrees(slice.longitude, slice.latitude, 0)
        const color = slice.phase === 'history'
          ? Cesium.Color.fromCssColorString('#00d2ff')
          : slice.phase === 'present'
          ? Cesium.Color.fromCssColorString('#52c41a')
          : Cesium.Color.fromCssColorString('#d3adf7')

        const badgeTag = slice.phase === 'history' ? '⏱️ 历史' : slice.phase === 'present' ? '🟢 当前' : '🔮 未来'
        const altStr = slice.altitude >= 1000 ? `${(slice.altitude / 1000).toFixed(1)}km` : `${slice.altitude}m`
        const fullLabel = `${badgeTag} · ${slice.label} (${slice.time})\n高程: ${altStr} | 航速: ${slice.speedKnots}节 (${(slice.speedKnots / 661.47).toFixed(2)}M)\n${slice.remark}`
        const shortLabel = `${badgeTag} · ${slice.time}`

        this.upsertSlicePoint(`SLICE_${target.id}_${idx}`, show, airPos, {
          color: isActive || isCurrentPhase ? color : color.withAlpha(0.4),
          pixelSize: isActive ? 17 : isCurrentPhase ? 13 : 7,
          outlineWidth: isActive ? 3.5 : isCurrentPhase ? 2.5 : 1,
          labelText: isActive ? fullLabel : shortLabel,
          labelShow: isActive || isCurrentPhase,
          labelOffsetY: isActive ? -42 : -26,
          labelColor: color
        })

        // 高度落差投影垂线 (直观呈现高空 ➔ 掠海的高度骤降，斜视视角下效果最佳)
        this.upsertSliceDropLine(`SLICE_DROP_${target.id}_${idx}`, show && slice.altitude > 100, airPos, groundPos, color)
      })
    })
  }

  /** 三态切片趋势连线：按需创建/显隐/更新位置 (材质与颜色固定) */
  private upsertSliceFlowLine(
    id: string,
    show: boolean,
    positions: Cesium.Cartesian3[],
    materialKind: 'glow' | 'dash',
    cssColor: string,
    width: number
  ) {
    let entity = this.temporalSliceEntities.get(id)
    if (!show || positions.length < 2) {
      if (entity) entity.show = false
      return
    }
    if (!entity) {
      entity = this.viewer!.entities.add({
        id,
        show: true,
        polyline: {
          positions,
          width,
          material:
            materialKind === 'glow'
              ? new Cesium.PolylineGlowMaterialProperty({
                  glowPower: 0.35,
                  color: Cesium.Color.fromCssColorString(cssColor)
                })
              : new Cesium.PolylineDashMaterialProperty({
                  color: Cesium.Color.fromCssColorString(cssColor),
                  dashLength: 16
                }),
          clampToGround: false
        }
      })
      this.temporalSliceEntities.set(id, entity)
    } else {
      entity.show = true
      if (entity.polyline) {
        entity.polyline.positions = new Cesium.ConstantProperty(positions)
      }
    }
  }

  /** 三态切片点位与标牌：样式属性每次渲染全量刷新 (修复旧实现创建后永不更新的问题) */
  private upsertSlicePoint(
    id: string,
    show: boolean,
    position: Cesium.Cartesian3,
    style: {
      color: Cesium.Color
      pixelSize: number
      outlineWidth: number
      labelText: string
      labelShow: boolean
      labelOffsetY: number
      labelColor: Cesium.Color
    }
  ) {
    let entity = this.temporalSliceEntities.get(id)
    if (!entity) {
      entity = this.viewer!.entities.add({
        id,
        show: show,
        position,
        point: {
          pixelSize: style.pixelSize,
          color: style.color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: style.outlineWidth,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: style.labelText,
          font: 'bold 12px sans-serif',
          fillColor: style.labelColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(8,16,32,0.92)'),
          show: style.labelShow,
          pixelOffset: new Cesium.Cartesian2(0, style.labelOffsetY),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
      this.temporalSliceEntities.set(id, entity)
    } else {
      entity.show = show
      entity.position = new Cesium.ConstantPositionProperty(position)
    }
    if (entity.point) {
      entity.point.pixelSize = new Cesium.ConstantProperty(style.pixelSize)
      entity.point.color = new Cesium.ConstantProperty(style.color)
      entity.point.outlineWidth = new Cesium.ConstantProperty(style.outlineWidth)
    }
    if (entity.label) {
      entity.label.text = new Cesium.ConstantProperty(style.labelText)
      entity.label.show = new Cesium.ConstantProperty(style.labelShow)
      entity.label.fillColor = new Cesium.ConstantProperty(style.labelColor)
      entity.label.pixelOffset = new Cesium.ConstantProperty(new Cesium.Cartesian2(0, style.labelOffsetY))
    }
  }

  /** 三态切片高度垂线：按需创建/显隐/更新位置 (颜色固定) */
  private upsertSliceDropLine(id: string, show: boolean, airPos: Cesium.Cartesian3, groundPos: Cesium.Cartesian3, color: Cesium.Color) {
    let entity = this.temporalSliceEntities.get(id)
    if (!show) {
      if (entity) entity.show = false
      return
    }
    if (!entity) {
      entity = this.viewer!.entities.add({
        id,
        show: true,
        polyline: {
          positions: [airPos, groundPos],
          width: 1.5,
          material: new Cesium.PolylineDashMaterialProperty({
            color: color.withAlpha(0.6),
            dashLength: 8
          }),
          clampToGround: false
        }
      })
      this.temporalSliceEntities.set(id, entity)
    } else {
      entity.show = true
      if (entity.polyline) {
        entity.polyline.positions = new Cesium.ConstantProperty([airPos, groundPos])
      }
    }
  }

  private pruneStaleTargets(targets: SituationTarget[]) {
    if (!this.viewer) return
    const alive = new Set(targets.map((t) => t.id))
    this.entityMap.forEach((entity, id) => {
      if (!alive.has(id)) {
        this.viewer!.entities.remove(entity)
        this.entityMap.delete(id)
      }
    })
    this.trackEntities.forEach((entity, id) => {
      const tid = id.replace('TRACK_', '')
      if (!alive.has(tid)) {
        this.viewer!.entities.remove(entity)
        this.trackEntities.delete(id)
      }
    })
    this.highlightEntities.forEach((entity, id) => {
      const tid = id.replace('HL_', '')
      if (!alive.has(tid)) {
        this.viewer!.entities.remove(entity)
        this.highlightEntities.delete(id)
      }
    })
    this.radarVisualSets.forEach((set, targetId) => {
      if (!alive.has(targetId)) {
        Object.values(set).forEach((entity) => this.viewer!.entities.remove(entity))
        this.radarVisualSets.delete(targetId)
        this.radarConeEntities.delete(`RADAR_CONE_${targetId}`)
        this.radarVisibility.delete(targetId)
        this.radarRangeTransitions.delete(targetId)
      }
    })
    this.jammingVisualSets.forEach((set, key) => {
      const [jammerId, jammedId] = key.split('__')
      if (!alive.has(jammerId) || !alive.has(jammedId)) {
        Object.values(set).forEach((entity) => this.viewer!.entities.remove(entity))
        this.jammingVisualSets.delete(key)
      }
    })
  }

  private syncHighlightRing(target: SituationTarget, visible: boolean) {
    if (!this.viewer) return
    const hid = `HL_${target.id}`
    let ring = this.highlightEntities.get(hid)
    const pos = Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, target.altitude)
    if (!visible) {
      if (ring) ring.show = false
      return
    }
    if (!ring) {
      ring = this.viewer.entities.add({
        id: hid,
        position: pos,
        ellipse: {
          semiMajorAxis: 18000,
          semiMinorAxis: 18000,
          material: Cesium.Color.WHITE.withAlpha(0.12),
          outline: true,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.85),
          height: target.altitude
        }
      })
      this.highlightEntities.set(hid, ring)
    } else {
      ring.show = true
      ring.position = new Cesium.ConstantPositionProperty(pos)
    }
  }

  public startPickPlacement(
    onPicked: (lon: number, lat: number) => void,
    onCancel?: () => void
  ) {
    if (!this.viewer) return
    this.clearActiveHandler()
    this.interactionMode = 'construct'
    this.activeHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    this.activeHandler.setInputAction((click: any) => {
      const cartesian =
        this.viewer!.camera.pickEllipsoid(click.position, this.viewer!.scene.globe.ellipsoid)
      if (!cartesian) return
      const carto = Cesium.Cartographic.fromCartesian(cartesian)
      const lon = Cesium.Math.toDegrees(carto.longitude)
      const lat = Cesium.Math.toDegrees(carto.latitude)
      this.clearActiveHandler()
      this.interactionMode = 'idle'
      onPicked(Number(lon.toFixed(4)), Number(lat.toFixed(4)))
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this.activeHandler.setInputAction(() => {
      this.clearActiveHandler()
      this.interactionMode = 'idle'
      onCancel?.()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  public startDrawRect(
    onCompleted: (rect: { west: number; south: number; east: number; north: number }) => void,
    onCancel?: () => void
  ) {
    if (!this.viewer) return
    this.clearActiveHandler()
    this.interactionMode = 'search-rect'
    const corners: Cesium.Cartesian3[] = []
    const dynamicPositions = new Cesium.CallbackProperty(() => {
      if (corners.length < 2) return corners
      const c1 = Cesium.Cartographic.fromCartesian(corners[0])
      const c2 = Cesium.Cartographic.fromCartesian(corners[1])
      const west = Math.min(c1.longitude, c2.longitude)
      const east = Math.max(c1.longitude, c2.longitude)
      const south = Math.min(c1.latitude, c2.latitude)
      const north = Math.max(c1.latitude, c2.latitude)
      return Cesium.Cartesian3.fromRadiansArrayHeights([
        west, south, 0, east, south, 0, east, north, 0, west, north, 0, west, south, 0
      ])
    }, false)
    const rectEntity = this.viewer.entities.add({
      polyline: {
        positions: dynamicPositions,
        width: 2,
        material: Cesium.Color.fromCssColorString('#00ffff')
      }
    })
    this.measureEntities.push(rectEntity)

    this.activeHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    this.activeHandler.setInputAction((click: any) => {
      const cartesian =
        this.viewer!.camera.pickEllipsoid(click.position, this.viewer!.scene.globe.ellipsoid)
      if (!cartesian) return
      if (corners.length === 0) {
        corners.push(cartesian)
        corners.push(cartesian)
      } else {
        corners[1] = cartesian
        const c1 = Cesium.Cartographic.fromCartesian(corners[0])
        const c2 = Cesium.Cartographic.fromCartesian(corners[1])
        this.clearActiveHandler()
        this.interactionMode = 'idle'
        onCompleted({
          west: Cesium.Math.toDegrees(Math.min(c1.longitude, c2.longitude)),
          east: Cesium.Math.toDegrees(Math.max(c1.longitude, c2.longitude)),
          south: Cesium.Math.toDegrees(Math.min(c1.latitude, c2.latitude)),
          north: Cesium.Math.toDegrees(Math.max(c1.latitude, c2.latitude))
        })
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this.activeHandler.setInputAction((move: any) => {
      if (corners.length < 2) return
      const cartesian =
        this.viewer!.camera.pickEllipsoid(move.endPosition, this.viewer!.scene.globe.ellipsoid)
      if (cartesian) corners[1] = cartesian
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    this.activeHandler.setInputAction(() => {
      this.clearActiveHandler()
      this.interactionMode = 'idle'
      onCancel?.()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  }

  private diamondImage(color: string): string {
    if (this.diamondImageCache[color]) return this.diamondImageCache[color]
    const canvas = document.createElement('canvas')
    canvas.width = 28
    canvas.height = 28
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(14, 2)
    ctx.lineTo(26, 14)
    ctx.lineTo(14, 26)
    ctx.lineTo(2, 14)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
    const url = canvas.toDataURL()
    this.diamondImageCache[color] = url
    return url
  }

  public renderEvents(events: SituationEvent[], targets: SituationTarget[], selectedEventId?: string | null) {
    if (!this.viewer) return
    const sceneStore = useSceneStore()
    // 事件属于事实内容：受 LAYER-FACTS 图层显隐控制（清空地图后随之隐藏）
    const factsTier = sceneStore.contentLayers.find((l) => l.id === 'LAYER-FACTS')
    const eventsVisible = factsTier ? factsTier.visible !== false : true
    const alive = new Set(events.map((e) => e.id))
    events.forEach((evt) => {
      const isEventVisible = eventsVisible && sceneStore.isEventVisible(evt.id)
      const eid = `EVENT_${evt.id}`
      let entity = this.eventEntities.get(eid)
      const color =
        evt.severity === 'critical' ? '#ff4d4f' : evt.severity === 'warning' ? '#fa8c16' : '#13c2c2'
      const pos = Cesium.Cartesian3.fromDegrees(evt.location[0], evt.location[1], evt.location[2] || 0)
      if (!entity) {
        entity = this.viewer!.entities.add({
          id: eid,
          show: isEventVisible,
          name: evt.eventName,
          position: pos,
          billboard: {
            image: this.diamondImage(color),
            scale: selectedEventId === evt.id ? 1.25 : 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: evt.eventName,
            font: '12px sans-serif',
            fillColor: Cesium.Color.fromCssColorString(color),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, 22),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        })
        this.eventEntities.set(eid, entity)
      } else {
        entity.position = new Cesium.ConstantPositionProperty(pos)
        entity.show = isEventVisible
        if (entity.billboard) {
          entity.billboard.scale = new Cesium.ConstantProperty(selectedEventId === evt.id ? 1.25 : 1)
        }
      }

      evt.affectedTargetIds.forEach((tid) => {
        const target = targets.find((t) => t.id === tid)
        if (!target) return
        const lid = `EVENT_LINK_${evt.id}_${tid}`
        let link = this.eventLinkEntities.get(lid)
        const start = pos
        const end = Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, target.altitude)
        if (!link) {
          link = this.viewer!.entities.add({
            id: lid,
            show: isEventVisible,
            polyline: {
              positions: [start, end],
              width: 1.4,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString(color).withAlpha(0.55),
                dashLength: 10
              })
            }
          })
          this.eventLinkEntities.set(lid, link)
        } else if (link.polyline) {
          link.polyline.positions = new Cesium.ConstantProperty([start, end])
          link.show = isEventVisible
        }
      })
    })

    this.eventEntities.forEach((entity, id) => {
      const raw = id.replace('EVENT_', '')
      if (!alive.has(raw)) {
        this.viewer!.entities.remove(entity)
        this.eventEntities.delete(id)
      }
    })
  }

  public extractEventId(rawId: string): string | null {
    return rawId.startsWith('EVENT_') ? rawId.replace('EVENT_', '') : null
  }

  public extractClusterId(rawId: string): string | null {
    return rawId.startsWith('CLUSTER_') ? rawId.replace('CLUSTER_', '') : null
  }

  public applyTargetClustering(targets: SituationTarget[]) {
    if (!this.viewer) return
    const sceneStore = useSceneStore()
    this.clusterEntities.forEach((e) => this.viewer!.entities.remove(e))
    this.clusterEntities.clear()
    this.clusteredTargetIds.clear()

    const height = this.viewer.camera.positionCartographic.height
    if (height < 280000) return

    const scene = this.viewer.scene
    const groups: Array<{ members: SituationTarget[]; x: number; y: number }> = []
    targets.forEach((target) => {
      if (target.isHypothesis) return
      // 图层树中被隐藏的目标不参与聚合，保证清空/隐藏后无残留聚合标牌
      if (!sceneStore.isTargetVisible(target.id)) return
      const cartesian = Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, target.altitude)
      const win =
        (Cesium.SceneTransforms as any).worldToWindowCoordinates?.(scene, cartesian) ||
        (Cesium.SceneTransforms as any).wgs84ToWindowCoordinates?.(scene, cartesian)
      if (!win) return
      const found = groups.find((g) => Math.hypot(g.x - win.x, g.y - win.y) < 46)
      if (found) {
        found.members.push(target)
        found.x = (found.x * (found.members.length - 1) + win.x) / found.members.length
        found.y = (found.y * (found.members.length - 1) + win.y) / found.members.length
      } else {
        groups.push({ members: [target], x: win.x, y: win.y })
      }
    })

    groups.forEach((g, idx) => {
      if (g.members.length < 2) return
      g.members.forEach((m) => this.clusteredTargetIds.add(m.id))
      const avgLon = g.members.reduce((s, m) => s + m.longitude, 0) / g.members.length
      const avgLat = g.members.reduce((s, m) => s + m.latitude, 0) / g.members.length
      const cid = `CLUSTER_${idx}`
      const entity = this.viewer!.entities.add({
        id: cid,
        position: Cesium.Cartesian3.fromDegrees(avgLon, avgLat, 8000),
        point: {
          pixelSize: 22,
          color: Cesium.Color.fromCssColorString('#00d2ff'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: `×${g.members.length}`,
          font: 'bold 13px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
      this.clusterEntities.set(cid, entity)
    })
  }

  public renderAnalysisOverlay(
    grids: Array<{ gridId: string; center: [number, number]; count: number; densityLevel: string; label?: string }>,
    mode: 'grid' | 'admin' | 'user_rect',
    caption: string
  ) {
    if (!this.viewer) return
    this.analysisOverlayEntities.forEach((e) => this.viewer!.entities.remove(e))
    this.analysisOverlayEntities.clear()
    grids.forEach((g) => {
      const color =
        g.densityLevel === '高'
          ? Cesium.Color.fromCssColorString('#ff4d4f').withAlpha(0.35)
          : g.densityLevel === '中'
            ? Cesium.Color.fromCssColorString('#faad14').withAlpha(0.3)
            : Cesium.Color.fromCssColorString('#00d2ff').withAlpha(0.22)
      const size = mode === 'grid' ? 55000 : mode === 'admin' ? 120000 : 90000
      const entity = this.viewer!.entities.add({
        id: `ANL_${g.gridId}`,
        position: Cesium.Cartesian3.fromDegrees(g.center[0], g.center[1], 0),
        ellipse: {
          semiMajorAxis: size,
          semiMinorAxis: size,
          material: color,
          outline: true,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.7)
        },
        label: {
          text: `${g.label || g.gridId}\n${g.count}（${caption}）`,
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
      this.analysisOverlayEntities.set(`ANL_${g.gridId}`, entity)
    })
  }

  public zoomIntoCluster(clusterId: string, targets: SituationTarget[]) {
    const entity = this.clusterEntities.get(`CLUSTER_${clusterId}`) || this.clusterEntities.get(clusterId)
    if (!entity || !this.viewer) {
      const height = this.viewer?.camera.positionCartographic.height || 800000
      this.viewer?.camera.zoomIn(height * 0.45)
      return
    }
    const pos = entity.position?.getValue(Cesium.JulianDate.now())
    if (!pos) return
    const carto = Cesium.Cartographic.fromCartesian(pos)
    const nextHeight = Math.max(120000, this.viewer.camera.positionCartographic.height * 0.45)
    this.flyToLocation(
      Cesium.Math.toDegrees(carto.longitude),
      Cesium.Math.toDegrees(carto.latitude),
      nextHeight,
      0,
      -89.9
    )
    void targets
  }

  /**
   * 纯数据驱动：根据目标实体对象集合，自动聚合经纬度计算最佳相机视窗
   */
  public flyToTargets(targets: SituationTarget[]) {
    if (!targets || targets.length === 0) {
      this.flyToLocation(116.0, 26.0, 14500000, 0, -89.9)
      return
    }

    if (targets.length === 1) {
      this.focusTarget(targets[0], 650000)
      return
    }

    const coords = targets.map((t) => [t.longitude, t.latitude] as [number, number])
    this.flyToCoordinates(coords, 650000)
  }

  /**
   * 纯数据驱动：根据战区多边形对象，自动计算多边形中心与外接包络视窗
   */
  public flyToRegion(region: SituationRegion) {
    if (!region || !region.coordinates || region.coordinates.length === 0) return
    this.flyToCoordinates(region.coordinates, 600000)
  }

  public destroy() {
    this.clearActiveHandler()
    this.removeRadarClockListener?.()
    this.removeRadarClockListener = null
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy()
      this.viewer = null
    }
    this.entityMap.clear()
    this.trackEntities.clear()
    this.relationEntities.clear()
    this.relationLabels.clear()
    this.regionEntities.clear()
    this.regionLabels.clear()
    this.radarConeEntities.clear()
    this.radarVisualSets.clear()
    this.jammingVisualSets.clear()
    this.radarVisibility.clear()
    this.radarRangeTransitions.clear()
    this.latestTargets.clear()
    this.futureTrackEntities.clear()
    this.futureBranchEntities.clear()
    this.temporalSliceEntities.clear()
    this.eventEntities.clear()
    this.eventLinkEntities.clear()
    this.clusterEntities.clear()
    this.highlightEntities.clear()
    this.measureEntities = []
  }
}

/**
 * 解析三态切片实体 ID (SLICE_{targetId}_{idx} / SLICE_DROP_{targetId}_{idx}) 为所属目标与切片序号。
 * 趋势连线 (SLICE_FLOW_*) 与非切片实体返回 null。
 */
export function parseSliceEntityId(rawId: unknown): { targetId: string; index: number } | null {
  if (typeof rawId !== 'string') return null
  if (rawId.startsWith('SLICE_FLOW_')) return null
  let rest: string
  if (rawId.startsWith('SLICE_DROP_')) {
    rest = rawId.slice('SLICE_DROP_'.length)
  } else if (rawId.startsWith('SLICE_')) {
    rest = rawId.slice('SLICE_'.length)
  } else {
    return null
  }
  const sepIdx = rest.lastIndexOf('_')
  if (sepIdx <= 0) return null
  const index = Number(rest.slice(sepIdx + 1))
  if (!Number.isInteger(index) || index < 0) return null
  return { targetId: rest.slice(0, sepIdx), index }
}

export const cesiumController = new CesiumController()
