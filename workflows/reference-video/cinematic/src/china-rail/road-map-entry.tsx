import {Composition, registerRoot} from 'remotion';
import {RoadMap, roadMapDefaults} from './road-map';

registerRoot(() => <Composition id="ChinaRailRoadMap" component={RoadMap} width={1920} height={1080}
  fps={24} durationInFrames={7200} defaultProps={roadMapDefaults}/>);
