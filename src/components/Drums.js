import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import MIDISounds from 'midi-sounds-react';

const style = {
    height: 500 // we can control scene size by setting container dimensions
};

class Drums extends Component {

    constructor(props) {
        super(props);
        this.midiNotes=[];
		this.state = {
			selectedInstrument: 192
			,status:'?'
		};
        this.keyMappings = {
            'Q': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Kick_2.wav', 'Component_13_001'],
            'W': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Snare_2.wav', 'Component_9_001'],
            'E': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Snare_3.wav', 'Component_9_003'],
            'R': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_HiHat_Open_2.wav', 'Component_14_001'],
            'T': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Tom_2.wav', 'Component_9_005'],
            'Y': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Tom_3.wav', 'Component_9_007'],
            'U': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Ride_Cymbal_1.wav', 'Component_16_001'],
            'A': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Tom_1.wav', 'Component_2_003'],
            'S': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Crash_Cymbal_2.wav', 'Component_11_001'],
            'D': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Snare_1.wav', 'Component_2_001'],
            'F': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_HiHat_Closed_1.wav', 'Component_15_001'],
            'G': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Tom_4.wav', 'sketchup_download200608261108382_3_001'],
            'H': ['https://drum-sounds.s3.amazonaws.com/Drums_FreeCodeCamp_Tom_4.wav', 'sketchup_download200608261108382_3_001'],
          };
        this.audioMap = {};
        Object.keys(this.keyMappings).forEach(key => {
          const audioUrl = this.keyMappings[key][0];
          const audioName = this.keyMappings[key][1];
          this.audioMap[audioName] = new Audio(audioUrl);
        });
    
      }
      
    
    componentDidMount() {
        this.sceneSetup();
        this.addLights();
        this.loadTheModel();
        this.startAnimationLoop();
        document.addEventListener('keydown', this.handleKeyPress);
        document.addEventListener('keyup', this.handleKeyUp);
		this.envelopes=[];				
    }    

    onSelectInstrument(e){
		var list=e.target;
		let n = list.options[list.selectedIndex].getAttribute("value");
		this.setState({
			selectedInstrument: n
		});
		this.midiSounds.cacheInstrument(n);
	}

	createSelectItems() {
		if (this.midiSounds) {
			if (!(this.items)) {
				this.items = [];
				for (let i = 0; i < this.midiSounds.player.loader.instrumentKeys().length; i++) {
					this.items.push(<option key={i} value={i}>{'' + (i + 0) + '. ' + this.midiSounds.player.loader.instrumentInfo(i).title}</option>);
				}
			}
			return this.items;
		}
	}

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleWindowResize);
        window.cancelAnimationFrame(this.requestID);
        this.controls.dispose();
    }

    // Standard scene setup in Three.js. Check "Creating a scene" manual for more information
    // https://threejs.org/docs/#manual/en/introduction/Creating-a-scene
    sceneSetup = () => {
        // get container dimensions and use them for scene sizing
        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, // fov = field of view
            width / height, // aspect ratio
            0.1, // near plane
            1000 // far plane
        );
        this.camera.position.z = 500; // is used here to set some distance from a cube that is located at z = 0
        // OrbitControls allow a camera to orbit around the object
        // https://threejs.org/docs/#examples/controls/OrbitControls
        this.controls = new OrbitControls( this.camera, this.mount );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( width, height );
        this.mount.appendChild( this.renderer.domElement ); // mount using React ref
    };

    handleKeyPress = (event) => {
        const key = event.key;
        if (key in this.keyMappings) {
          const note = this.keyMappings[key];
          console.log(note);
          const el = this.scene.getObjectByName(note[1]);
          console.log(el);
          const audioName = note[0]
          const audio = this.audioMap[audioName];
          audio.currentTime = 0;
          audio.play();
      
          // clone the mesh and material
          const clonedMesh = el.clone();
          const clonedMaterial = el.material.clone();
        
          // modify the cloned material's color
          clonedMaterial.color.set(0x50C878);
        
          // replace the original material with the cloned material on the cloned mesh
          clonedMesh.material = clonedMaterial;
        
          // add the cloned mesh to the scene and remove the original mesh
          this.scene.add(clonedMesh);
          this.scene.remove(el);
        
          // set a timeout to revert the changes after one second
          setTimeout(() => {
            // replace the cloned material with the original material on the cloned mesh
            clonedMesh.material = el.material;
        
            // add the original mesh back to the scene and remove the cloned mesh
            this.scene.add(el);
            this.scene.remove(clonedMesh);
          }, 500);
        }
    };
    
      handleKeyUp = (event) => {
        const key = event.key;
        if (key in this.keyMappings) {
            const note = this.keyMappings[key];

            const el = this.scene.getObjectByName(note[1]);
            this.keyUp(note[0])
            // // change some custom props of the element: placement, color, rotation, anything that should be
            // // done once the model was loaded and ready for display
          //   el.position.set(0, -150,0 );
            // el.material.color.set(0x50C878);
            el.rotation.x = 0;       
          }
      };
    

    // Code below is taken from Three.js OBJ Loader example
    // https://threejs.org/docs/#examples/en/loaders/OBJLoader
    loadTheModel = () => {
        // instantiate a loader
        const loader = new OBJLoader();

        // load a resource
        loader.load(
            // resource URL relative to the /public/index.html of the app
            'drumset.obj',
            // called when resource is loaded
            ( object ) => {
                this.scene.add( object );

                // get the newly added object by name specified in the OBJ model (that is Elephant_4 in my case)
                // you can always set console.log(this.scene) and check its children to know the name of a model
                const el = this.scene.getObjectByName("uploads_files_3006275_drummer.obj");

                // // change some custom props of the element: placement, color, rotation, anything that should be
                // // done once the model was loaded and ready for display
                // el.position.set(0, -150,0 );
                // el.material.color.set(0x50C878);
                // el.rotation.x = 23.5;

                // // make this element available inside of the whole component to do any animation later
                this.model = el;
            },
            // called when loading is in progresses
             ( xhr ) => {

                const loadingPercentage = Math.ceil(xhr.loaded / xhr.total * 100);
                console.log( ( loadingPercentage ) + '% loaded' );

                // update parent react component to display loading percentage
                this.props.onProgress(loadingPercentage);
            },
            // called when loading has errors
             ( error ) => {

                console.log( 'An error happened:' + error );

            }
        );
    };

    // adding some lights to the scene
    addLights = () => {
        const lights = [];

        // set color and intensity of lights
        lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

        // place some lights around the scene for best looks and feel
        lights[ 0 ].position.set( 0, 4000, 0 );
        lights[ 1 ].position.set( 1000, 2000, 1000 );
        lights[ 2 ].position.set( - 1000, - 2000, - 1000 );

        this.scene.add( lights[ 0 ] );
        this.scene.add( lights[ 1 ] );
        this.scene.add( lights[ 2 ] );
    };

    startAnimationLoop = () => {
        // slowly rotate an object
        // if (this.model) this.model.rotation.z += 0.005;

        this.renderer.render( this.scene, this.camera );

        // The window.requestAnimationFrame() method tells the browser that you wish to perform
        // an animation and requests that the browser call a specified function
        // to update an animation before the next repaint
        this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
    };

    handleWindowResize = () => {
        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;

        this.renderer.setSize( width, height );
        this.camera.aspect = width / height;

        // Note that after making changes to most of camera properties you have to call
        // .updateProjectionMatrix for the changes to take effect.
        this.camera.updateProjectionMatrix();
    };

    render() {
        return (
        <>

            <p><select value={this.state.selectedInstrument} onChange={this.onSelectInstrument.bind(this)}>{this.createSelectItems()}</select></p>


        <div style={style} ref={ref => (this.mount = ref)} />
        
		<MIDISounds 
			ref={(ref) => (this.midiSounds = ref)} 
			appElementName="root" 
			instruments={[this.state.selectedInstrument]} 
			/>	

        </>
        
        );
    }
}

export default Drums;