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

export type BasemapType = 'satellite' | 'dark' | 'street'

export class CesiumController {
  public viewer: Cesium.Viewer | null = null
  private entityMap: Map<string, Cesium.Entity> = new Map()
  private trackEntities: Map<string, Cesium.Entity> = new Map()
  private relationEntities: Map<string, Cesium.Entity> = new Map()
  private relationLabels: Map<string, Cesium.Entity> = new Map()
  private regionEntities: Map<string, Cesium.Entity> = new Map()
  private regionLabels: Map<string, Cesium.Entity> = new Map()
  private radarConeEntities: Map<string, Cesium.Entity> = new Map()
  private futureTrackEntities: Map<string, Cesium.Entity> = new Map()
  private futureBranchEntities: Map<string, Cesium.Entity> = new Map()
  private temporalSliceEntities: Map<string, Cesium.Entity> = new Map()
  private measureEntities: Cesium.Entity[] = []
  private eventEntities: Map<string, Cesium.Entity> = new Map()
  private eventLinkEntities: Map<string, Cesium.Entity> = new Map()
  private plotEntities: Map<string, Cesium.Entity> = new Map()
  private clusterEntities: Map<string, Cesium.Entity> = new Map()
  private highlightEntities: Map<string, Cesium.Entity> = new Map()

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
      this.renderSingleRadarCone(target, isRadarVisible && !shouldDim)
      this.syncHighlightRing(target, isHighlighted && pointVisible)
    })

    this.pruneStaleTargets(targets)
  }

  public updateTargetPositions(targets: SituationTarget[]) {
    if (!this.viewer) return
    targets.forEach((target) => {
      const entity = this.entityMap.get(target.id)
      if (!entity) return
      const pos = Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, target.altitude)
      entity.position = new Cesium.ConstantPositionProperty(pos)
      const cone = this.radarConeEntities.get(`RADAR_CONE_${target.id}`)
      if (cone) cone.position = new Cesium.ConstantPositionProperty(pos)
      const ring = this.highlightEntities.get(`HL_${target.id}`)
      if (ring) ring.position = new Cesium.ConstantPositionProperty(pos)
    })
  }

  /** 渲染单个目标的 3D 传感器雷达扫描锥/探测穹顶 */
  private renderSingleRadarCone(target: SituationTarget, isVisible: boolean) {
    if (!this.viewer || !target.sensorCoverage) return

    const coneId = `RADAR_CONE_${target.id}`
    let coneEntity = this.radarConeEntities.get(coneId)

    const center = Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, target.altitude)
    const radiusMeters = target.sensorCoverage.radarRangeKm * 1000
    const color = Cesium.Color.fromCssColorString(target.sensorCoverage.coneColor).withAlpha(0.14)
    const outlineColor = Cesium.Color.fromCssColorString(target.sensorCoverage.coneColor).withAlpha(0.65)

    if (!coneEntity) {
      coneEntity = this.viewer!.entities.add({
        id: coneId,
        show: isVisible,
        position: center,
        ellipsoid: {
          radii: new Cesium.Cartesian3(radiusMeters, radiusMeters, Math.min(radiusMeters, 25000)),
          maximumCone: Cesium.Math.toRadians(target.sensorCoverage.scanAngleDeg / 2),
          material: color,
          outline: true,
          outlineColor: outlineColor,
          outlineWidth: 1.5
        }
      })
      this.radarConeEntities.set(coneId, coneEntity)
    } else {
      coneEntity.show = isVisible
      coneEntity.position = new Cesium.ConstantPositionProperty(center)
    }
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
    const alive = new Set(events.map((e) => e.id))
    events.forEach((evt) => {
      const eid = `EVENT_${evt.id}`
      let entity = this.eventEntities.get(eid)
      const color =
        evt.severity === 'critical' ? '#ff4d4f' : evt.severity === 'warning' ? '#fa8c16' : '#13c2c2'
      const pos = Cesium.Cartesian3.fromDegrees(evt.location[0], evt.location[1], evt.location[2] || 0)
      if (!entity) {
        entity = this.viewer!.entities.add({
          id: eid,
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
    this.clusterEntities.forEach((e) => this.viewer!.entities.remove(e))
    this.clusterEntities.clear()
    this.clusteredTargetIds.clear()

    const height = this.viewer.camera.positionCartographic.height
    if (height < 280000) return

    const scene = this.viewer.scene
    const groups: Array<{ members: SituationTarget[]; x: number; y: number }> = []
    targets.forEach((target) => {
      if (target.isHypothesis) return
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
