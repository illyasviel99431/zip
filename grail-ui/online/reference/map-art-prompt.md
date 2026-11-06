# 지도 원화 제작 기록

도구: 기본 image_gen 도구, 구도 참조 이미지를 사용한 새 원화 생성.
참조: map-layout-guide.svg에서 렌더링한 map-layout-reference.png. 기존 프로젝트의 구도만 참고.
목적: 지도 배경 원화. 지역 이름·선택 테두리·클릭 영역은 웹에서 별도 표시.

## 병원 수정 최종 프롬프트 (v0.7.4)

도구: 내장 image_gen, precise-object-edit. 원본 지도 파일을 편집 대상으로 전달했습니다.
저장: `dist/assets/lumia-island-hospital-v2.png`. 웹에서는 병원 경계 안에만 덧그려 다른 지역의 원본 그림을 보존합니다.

Use case: precise-object-edit.
Asset type: existing painted isometric island game map, one localized building replacement.
Input image 1 is the EDIT TARGET. Keep the complete island map framing, aspect ratio, coastline, lighting, camera and every other landmark in exactly the same locations.
Primary request: replace ONLY the hospital building in the LOWER LEFT of the island, directly BELOW the archery target range, LEFT of the forest and mountain. It is the freestanding cream-colored four-story red-roofed mansion at approximately x=200..355, y=510..655 on the 1521x1034 source. Do NOT change the large town hall above the archery range, or the school beside it.
Make that one building immediately recognizable as a small hospital at thumbnail size: a compact four-story ivory-white medical block with a FLAT roof, broad blue-green horizontal window bands, a LARGE GREEN medical plus symbol on the roof and a second green plus high on its front facade, a clear ground-floor emergency entrance with a red-orange canopy, and one small white ambulance with a blue emergency light and colored stripe parked beside the entrance. The ambulance and entrance stay within the same existing hospital forecourt. Weather the walls lightly and integrate ivy at the edges so it fits the hand-painted semi-realistic coastal survival-game architecture.
Text: only a small canopy sign reading "응급실", if readable. Prioritize the big medical symbols and silhouette, not text.
STRICT INVARIANTS: change only the hospital building and its immediate entrance/forecourt, within approximately x=180..370, y=485..700. Preserve the existing hospital size, footprint and ground position. Preserve the adjacent archery range, school, forest, cliff, roads and sea. All other pixels and landmarks across the map should remain unchanged. Keep the original detailed painterly brushwork, sunlight direction, weathered materials, color grading and isometric perspective. No map labels, no region borders, no extra buildings, no UI, no people, no watermark. Return the full map in the same framing.

## 최초 원화 생성 프롬프트

Use case: stylized-concept / sketch-to-render.
Asset type: finished, text-free background art for a playable 22-region survival-game island map.
Input image 1 is ONLY a precise layout blueprint. Preserve its overall coastline silhouette, the locations and relative sizes of every landmark, its framing, and its 1000:680 landscape aspect ratio. Replace the simplistic vector artwork completely with a sophisticated, richly painted isometric game-world illustration. This is finished game art, not a UI mockup.

Art direction: professional hand-painted strategy/RPG world-map illustration, detailed miniature architecture with believable construction, beautifully shaded terrain and rocky coast, intricate foliage, natural painterly textures and atmospheric depth. Semi-realistic, cohesive and elegant. Crisp readable silhouettes viewed from a high 3/4 aerial angle. Sunlight from upper left, soft ambient occlusion, consistent shadows and scale. Bright enough to navigate, slightly mysterious abandoned coastal town mood. Deep desaturated teal-blue sea, olive and forest green woodland, warm weathered stone, muted slate and rust rooftops, pale sand. Do not use flat polygons, low-poly geometry, crude triangular trees, stock icons, thick vector outlines or smooth plastic toy buildings.

Keep the following 22 neighborhoods in these exact approximate normalized locations on the 1000 by 680 canvas. Coordinates describe the neighborhood's ground center, not the top of a building:
1 western-north harbor and small docks/boats (123,180);
2 northwest industrial factory with two chimneys, warehouse and pipes (283,117);
3 northern dilapidated apartment/slum cluster (444,122);
4 northeastern tall coastal hotel with a garden (735,226);
5 eastern stone church/chapel with steeple (899,285);
6 northwestern-center town hall/civic building (231,238);
7 north-center-left fire station with garage bays (375,242);
8 north-center-right pond with organic shoreline, rocks and willows (591,243);
9 western alley of compact weathered houses (142,314);
10 west-center school with clock facade and small sports yard (279,347);
11 central isolated scientific research complex (502,341);
12 rocky mountain trail to southwest of research center (409,418);
13 east-center mountain tunnel entrance (668,361);
14 eastern affluent residential houses and gardens (835,380);
15 far-west archery training field with subtle target stands (110,384);
16 southwest hospital building (193,464);
17 dense natural woodland at southwest-center (305,485);
18 cemetery with varied headstones and stone paths south of research center (543,483);
19 old stone well and modest wooden shelter at southeast-center (679,500);
20 southeast traditional East Asian temple with tiled roofs (797,521);
21 southeastern lighthouse on rocky coastal point (913,561);
22 long southern sandy beach (483,554).
Use the image to disambiguate all positions. Keep the same relationships and separation. The factory remains upper left; the church remains right; the research complex remains central; the beach stays along the lower edge.

Natural narrow roads and footpaths connect neighborhoods. Roads should have believable gravel and dirt texture, modest width and subtle edging, not form geometric tiles or loud region borders. Model terrain as continuous hills, cliffs, forest floor and shore. Add fine surf foam and shallow water around rocks; keep the coastline crisp and faithful to the blueprint. Buildings should have rooftops, eaves, windows, masonry, weathering, small contextual details and grounded shadows, with much greater material detail than the reference. Do not add extra major regions or replace the composition with a generic island.

Critical constraints: absolutely no labels, words, letters, numbers, captions, nameplates, map markers, pins, UI, frames, compass, legend, grid, selection outlines, boundary overlays or watermark. Even the HOTEL lettering in the reference must be removed. No characters or portraits. Do not place a large decorative castle or fantasy landmark anywhere. All artwork stays within the image; no cut-off buildings; ocean fills the rectangular canvas. The website will draw its own accurate labels and interaction layers over this image. Deliver one polished production-ready landscape island illustration.
